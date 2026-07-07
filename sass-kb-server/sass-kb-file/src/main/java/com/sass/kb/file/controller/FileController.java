package com.sass.kb.file.controller;

import com.sass.kb.common.event.EntityEvent;
import com.sass.kb.common.event.EventPublisher;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.file.entity.FileAsset;
import com.sass.kb.file.service.FileService;
import com.sass.kb.tenant.context.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Tag(name = "文件管理", description = "文件上传、下载与管理")
@RestController
@RequestMapping("/api/file")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final EventPublisher eventPublisher;

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "application/pdf",
            "text/plain", "text/csv",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/zip", "application/x-7z-compressed", "application/x-rar-compressed",
            "video/mp4"
    );

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    @Operation(summary = "上传文件")
    @PostMapping("/upload")
    public R<FileAsset> upload(@RequestParam("file") MultipartFile file,
                                @RequestParam(required = false) String spaceId,
                                HttpServletRequest request) {
        if (file.isEmpty()) {
            return R.fail(400, "文件不能为空");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            return R.fail(400, "不支持的文件类型: " + contentType);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            return R.fail(400, "文件大小超过限制 (最大 50MB)");
        }
        String userId = (String) request.getAttribute("userId");
        FileAsset asset = fileService.upload(file, spaceId, userId);
        eventPublisher.publish(EntityEvent.of("CREATED", "FILE", asset.getId(), TenantContext.getCurrentTenantId()));
        return R.ok(asset);
    }

    @Operation(summary = "获取文件信息")
    @GetMapping("/{id}")
    public R<FileAsset> getById(@PathVariable String id) {
        return R.ok(fileService.getById(id));
    }

    @Operation(summary = "获取文件下载链接")
    @GetMapping("/{id}/download")
    public R<String> download(@PathVariable String id, HttpServletRequest request) {
        // 带上 token 参数，浏览器直接打开也能通过鉴权
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        String url = "/api/file/" + id + "/download-file";
        if (token != null) {
            url += "?token=" + token;
        }
        return R.ok(url);
    }

    @Operation(summary = "下载文件")
    @GetMapping("/{id}/download-file")
    public void downloadFile(@PathVariable String id,
                             @RequestParam(required = false) String token,
                             jakarta.servlet.http.HttpServletResponse response) {
        // token 已通过 URL 参数传递，浏览器直接打开也能下载
        fileService.downloadToStream(id, response);
    }

    @Operation(summary = "获取文件文本内容")
    @GetMapping("/{id}/content")
    public R<String> getContent(@PathVariable String id) {
        return R.ok(fileService.getContent(id));
    }

    @Operation(summary = "保存文件文本内容")
    @PutMapping("/{id}/content")
    public R<Void> saveContent(@PathVariable String id, @RequestBody String content) {
        fileService.saveContent(id, content);
        eventPublisher.publish(EntityEvent.of("UPDATED", "FILE", id, TenantContext.getCurrentTenantId()));
        return R.ok();
    }

    @Operation(summary = "删除文件")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        fileService.delete(id);
        eventPublisher.publish(EntityEvent.of("DELETED", "FILE", id, TenantContext.getCurrentTenantId()));
        return R.ok();
    }

    @Operation(summary = "获取文件列表")
    @GetMapping("/list")
    public R<PageResult<FileAsset>> list(
            @RequestParam(required = false) String spaceId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        return R.ok(fileService.list(spaceId, page, size, keyword));
    }
}
