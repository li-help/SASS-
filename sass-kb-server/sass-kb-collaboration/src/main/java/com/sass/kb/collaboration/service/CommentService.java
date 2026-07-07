package com.sass.kb.collaboration.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.collaboration.dto.CommentNode;
import com.sass.kb.collaboration.entity.Comment;
import com.sass.kb.collaboration.mapper.CommentMapper;
import com.sass.kb.common.exception.BizException;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentMapper commentMapper;
    private final UserMapper userMapper;
    private final RabbitTemplate rabbitTemplate;

    public CommentNode create(String docId, String content, String parentId, String userId) {
        // Validate parent exists if provided
        if (parentId != null) {
            Comment parent = commentMapper.selectById(parentId);
            if (parent == null) {
                throw new BizException(404, "父评论不存在");
            }
            if (!parent.getDocumentId().equals(docId)) {
                throw new BizException(400, "父评论不属于该文档");
            }
        }

        Comment c = new Comment();
        c.setId(IdUtil.fastSimpleUUID());
        c.setDocumentId(docId);
        c.setContent(content);
        c.setParentId(parentId);
        c.setCreatedBy(userId);
        commentMapper.insert(c);
        c = commentMapper.selectById(c.getId());

        // Send notification event via RabbitMQ
        try {
            User commenter = userMapper.selectById(userId);
            String commenterName = commenter != null ?
                    (commenter.getRealName() != null ? commenter.getRealName() : commenter.getUsername()) : "未知用户";
            Map<String, Object> event = Map.of(
                    "docId", docId,
                    "commenterId", userId,
                    "commenterName", commenterName
            );
            rabbitTemplate.convertAndSend("notification.comment", new ObjectMapper().writeValueAsString(event));
        } catch (Exception ignored) {
            // Non-blocking: don't fail comment creation if notification fails
        }

        return toNode(c);
    }

    public List<CommentNode> getByDocument(String docId) {
        List<Comment> all = commentMapper.selectList(
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getDocumentId, docId)
                        .orderByAsc(Comment::getCreatedAt));

        // Build a userId → name map
        List<String> userIds = all.stream()
                .map(Comment::getCreatedBy)
                .filter(u -> u != null && !u.isBlank())
                .distinct()
                .toList();
        final Map<String, String> userNameMap;
        if (!userIds.isEmpty()) {
            List<User> users = userMapper.selectBatchIds(userIds);
            userNameMap = users.stream()
                    .filter(u -> u != null)
                    .collect(Collectors.toMap(User::getId, u ->
                            u.getRealName() != null ? u.getRealName() : u.getUsername()));
        } else {
            userNameMap = Map.of();
        }

        // Convert to nodes
        List<CommentNode> nodes = all.stream().map(c -> {
            CommentNode node = toNode(c);
            node.setCreatorName(userNameMap.getOrDefault(c.getCreatedBy(), "未知用户"));
            return node;
        }).toList();

        // Build tree: parentId → children
        Map<String, List<CommentNode>> childrenMap = nodes.stream()
                .filter(n -> n.getParentId() != null)
                .collect(Collectors.groupingBy(CommentNode::getParentId));

        // Attach children
        List<CommentNode> roots = new ArrayList<>();
        for (CommentNode node : nodes) {
            node.setChildren(childrenMap.getOrDefault(node.getId(), new ArrayList<>()));
            if (node.getParentId() == null) {
                roots.add(node);
            }
        }

        return roots;
    }

    public CommentNode update(String id, String content, String userId) {
        Comment existing = commentMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "评论不存在");
        }
        if (!existing.getCreatedBy().equals(userId)) {
            throw new BizException(403, "只能编辑自己的评论");
        }
        if (content != null) {
            existing.setContent(content);
        }
        commentMapper.updateById(existing);
        return toNode(commentMapper.selectById(id));
    }

    @Transactional
    public void delete(String id, String userId) {
        Comment existing = commentMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "评论不存在");
        }
        if (!existing.getCreatedBy().equals(userId)) {
            throw new BizException(403, "只能删除自己的评论");
        }
        // Cascade delete children
        cascadeDelete(id);
    }

    private void cascadeDelete(String parentId) {
        List<Comment> children = commentMapper.selectList(
                new LambdaQueryWrapper<Comment>().eq(Comment::getParentId, parentId));
        for (Comment child : children) {
            cascadeDelete(child.getId());
        }
        commentMapper.deleteById(parentId);
    }

    private CommentNode toNode(Comment c) {
        CommentNode node = new CommentNode();
        node.setId(c.getId());
        node.setDocumentId(c.getDocumentId());
        node.setParentId(c.getParentId());
        node.setContent(c.getContent());
        node.setCreatedBy(c.getCreatedBy());
        node.setCreatedAt(c.getCreatedAt());
        node.setUpdatedAt(c.getUpdatedAt());
        return node;
    }
}
