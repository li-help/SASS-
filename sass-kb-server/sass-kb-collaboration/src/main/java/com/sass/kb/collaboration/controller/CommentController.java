package com.sass.kb.collaboration.controller;

import com.sass.kb.collaboration.dto.CommentNode;
import com.sass.kb.collaboration.dto.CommentRequest;
import com.sass.kb.collaboration.service.CommentService;
import com.sass.kb.common.result.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "评论", description = "文档评论管理")
@RestController
@RequestMapping("/api/comment")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "获取文档评论列表")
    @GetMapping("/list/{docId}")
    public R<List<CommentNode>> list(@PathVariable String docId) {
        return R.ok(commentService.getByDocument(docId));
    }

    @Operation(summary = "创建评论")
    @PostMapping
    public R<CommentNode> create(@Valid @RequestBody CommentRequest req,
                                  HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return R.ok(commentService.create(req.getDocumentId(), req.getContent(),
                req.getParentId(), userId));
    }

    @Operation(summary = "更新评论")
    @PutMapping("/{id}")
    public R<CommentNode> update(@PathVariable String id,
                                  @RequestBody Map<String, String> body,
                                  HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return R.ok(commentService.update(id, body.get("content"), userId));
    }

    @Operation(summary = "删除评论")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        commentService.delete(id, userId);
        return R.ok();
    }
}
