package com.sass.kb.doc.controller;

import com.sass.kb.common.annotation.RequirePermission;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.doc.dto.DocSaveRequest;
import com.sass.kb.doc.entity.Document;
import com.sass.kb.doc.entity.DocumentVersion;
import com.sass.kb.doc.service.DocService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doc")
@RequiredArgsConstructor
public class DocController {

    private final DocService docService;

    @PostMapping
    public R<Document> create(@Valid @RequestBody Document doc, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return R.ok(docService.create(doc, userId));
    }

    @GetMapping("/{id}")
    public R<Document> getById(@PathVariable String id) {
        return R.ok(docService.getById(id));
    }

    @PutMapping("/{id}")
    @RequirePermission(resource = "doc", action = "write")
    public R<Document> save(@PathVariable String id, @Valid @RequestBody DocSaveRequest req,
                            HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (req.getUpdatedBy() == null) {
            req.setUpdatedBy(userId);
        }
        return R.ok(docService.save(id, req));
    }

    @DeleteMapping("/{id}")
    @RequirePermission(resource = "doc", action = "delete")
    public R<Void> delete(@PathVariable String id) {
        docService.delete(id);
        return R.ok();
    }

    @PutMapping("/{id}/status")
    @RequirePermission(resource = "doc", action = "write")
    public R<Document> updateStatus(@PathVariable String id, @RequestParam String status) {
        return R.ok(docService.updateStatus(id, status));
    }

    @GetMapping("/{id}/versions")
    public R<List<DocumentVersion>> versions(@PathVariable String id) {
        return R.ok(docService.getVersions(id));
    }

    @GetMapping("/{id}/versions/{versionNumber}")
    public R<DocumentVersion> getVersion(@PathVariable String id,
                                          @PathVariable Integer versionNumber) {
        return R.ok(docService.getVersion(id, versionNumber));
    }

    @GetMapping("/{id}/diff")
    public R<Map<String, String>> diff(@PathVariable String id,
                                        @RequestParam int v1,
                                        @RequestParam int v2) {
        return R.ok(docService.diff(id, v1, v2));
    }

    @GetMapping("/list")
    public R<PageResult<Document>> list(
            @RequestParam String spaceId,
            @RequestParam(required = false) String folderId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return R.ok(docService.listBySpace(spaceId, folderId, page, size, keyword, status));
    }

    @PutMapping("/{id}/versions/{versionNumber}/restore")
    @RequirePermission(resource = "doc", action = "write")
    public R<Document> restoreVersion(@PathVariable String id,
                                      @PathVariable Integer versionNumber,
                                      HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return R.ok(docService.restoreVersion(id, versionNumber, userId));
    }

    @GetMapping("/recent")
    public R<List<Document>> recent(@RequestParam(defaultValue = "5") int limit) {
        return R.ok(docService.getRecent(limit));
    }
}
