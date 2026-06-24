package com.sass.kb.file.controller;

import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.file.entity.FileAsset;
import com.sass.kb.file.service.FileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@RestController
@RequestMapping("/api/file")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

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
            "application/zip", "application/x-7z-compressed", "application/x-rar-compressed"
    );

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
        return R.ok(fileService.upload(file, spaceId, userId));
    }

    @GetMapping("/{id}")
    public R<FileAsset> getById(@PathVariable String id) {
        return R.ok(fileService.getById(id));
    }

    @GetMapping("/{id}/download")
    public R<String> download(@PathVariable String id) {
        String url = fileService.getDownloadUrl(id);
        return R.ok(url);
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        fileService.delete(id);
        return R.ok();
    }

    @GetMapping("/list")
    public R<PageResult<FileAsset>> list(
            @RequestParam(required = false) String spaceId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        return R.ok(fileService.list(spaceId, page, size, keyword));
    }
}
