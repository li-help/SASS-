package com.sass.kb.doc.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.doc.dto.SpaceTree;
import com.sass.kb.doc.entity.Folder;
import com.sass.kb.doc.entity.Document;
import com.sass.kb.doc.entity.Space;
import com.sass.kb.doc.mapper.FolderMapper;
import com.sass.kb.doc.mapper.DocumentMapper;
import com.sass.kb.doc.mapper.SpaceMapper;
import com.sass.kb.file.service.FileService;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceMapper spaceMapper;
    private final FolderMapper folderMapper;
    private final DocumentMapper documentMapper;
    private final DocService docService;
    private final FolderService folderService;
    private final FileService fileService;

    public List<Space> list(String keyword) {
        String tenantId = TenantContext.getCurrentTenantId();
        LambdaQueryWrapper<Space> qw = new LambdaQueryWrapper<>();
        qw.and(w -> w.eq(Space::getTenantId, tenantId)
                .or().isNull(Space::getTenantId)
                .or().eq(Space::getType, "public"));
        if (keyword != null && !keyword.isBlank()) {
            qw.like(Space::getName, keyword);
        }
        qw.orderByAsc(Space::getSortOrder).orderByDesc(Space::getCreatedAt);
        return spaceMapper.selectList(qw);
    }

    public Space create(Space space) {
        String tenantId = TenantContext.getCurrentTenantId();
        space.setId(IdUtil.fastSimpleUUID());
        space.setTenantId(tenantId);
        space.setType(space.getType() != null ? space.getType() : "private");
        space.setSortOrder(space.getSortOrder() != null ? space.getSortOrder() : 0);
        spaceMapper.insert(space);
        return space;
    }

    public Space update(String id, Space space) {
        Space existing = spaceMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "空间不存在");
        }
        space.setId(id);
        spaceMapper.updateById(space);
        return spaceMapper.selectById(id);
    }

    public void delete(String id) {
        Space existing = spaceMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "空间不存在");
        }

        // 1. 删除空间下的所有文档，触发 ES 清理、评论与历史版本物理级联删除
        List<Document> docs = documentMapper.selectList(
                new LambdaQueryWrapper<Document>().eq(Document::getSpaceId, id));
        for (Document doc : docs) {
            docService.delete(doc.getId());
        }

        // 2. 清理空间下的所有上传文件及 MinIO 物理文件对象
        fileService.deleteBySpaceId(id);

        // 3. 递归清理所有文件夹（从根文件夹开始）
        List<Folder> rootFolders = folderMapper.selectList(
                new LambdaQueryWrapper<Folder>()
                        .eq(Folder::getSpaceId, id)
                        .and(w -> w.isNull(Folder::getParentId).or().eq(Folder::getParentId, "root"))
        );
        for (Folder folder : rootFolders) {
            folderService.delete(folder.getId());
        }

        // 兜底：直接删除可能残留的任何属于该空间的文件夹记录
        folderMapper.delete(new LambdaQueryWrapper<Folder>().eq(Folder::getSpaceId, id));

        // 4. 删除空间本身
        spaceMapper.deleteById(id);
    }

    public List<SpaceTree> getTree(String spaceId) {
        Space space = spaceMapper.selectById(spaceId);
        if (space == null) {
            throw new BizException(404, "空间不存在");
        }

        // 查询所有文件夹
        List<Folder> folders = folderMapper.selectList(
                new LambdaQueryWrapper<Folder>().eq(Folder::getSpaceId, spaceId));
        // 查询所有文档
        List<Document> docs = documentMapper.selectList(
                new LambdaQueryWrapper<Document>().eq(Document::getSpaceId, spaceId));

        // 构建文件夹 map: parentId -> children
        Map<String, List<Folder>> folderMap = folders.stream()
                .collect(Collectors.groupingBy(f -> f.getParentId() != null ? f.getParentId() : "root"));

        // 递归构建树
        List<SpaceTree> tree = buildFolderTree("root", folderMap, docs, spaceId);
        if (tree.isEmpty()) {
            // 添加根节点下的文档
            List<Document> rootDocs = docs.stream()
                    .filter(d -> d.getFolderId() == null)
                    .toList();
            for (Document doc : rootDocs) {
                tree.add(toDocNode(doc));
            }
        }
        return tree;
    }

    private List<SpaceTree> buildFolderTree(String parentId, Map<String, List<Folder>> folderMap,
                                             List<Document> docs, String spaceId) {
        List<SpaceTree> nodes = new ArrayList<>();
        List<Folder> children = folderMap.getOrDefault(parentId, List.of());

        for (Folder folder : children) {
            SpaceTree node = SpaceTree.builder()
                    .id(folder.getId())
                    .name(folder.getName())
                    .type("folder")
                    .updatedAt(folder.getUpdatedAt())
                    .children(new ArrayList<>())
                    .build();
            // 递归子文件夹
            List<SpaceTree> subFolders = buildFolderTree(folder.getId(), folderMap, docs, spaceId);
            node.getChildren().addAll(subFolders);
            // 添加该文件夹下的文档
            List<Document> folderDocs = docs.stream()
                    .filter(d -> folder.getId().equals(d.getFolderId()))
                    .toList();
            for (Document doc : folderDocs) {
                node.getChildren().add(toDocNode(doc));
            }
            nodes.add(node);
        }
        return nodes;
    }

    private SpaceTree toDocNode(Document doc) {
        return SpaceTree.builder()
                .id(doc.getId())
                .name(doc.getTitle())
                .type("doc")
                .status(doc.getStatus())
                .updatedAt(doc.getUpdatedAt())
                .children(null)
                .build();
    }
}
