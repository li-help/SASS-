package com.sass.kb.doc.controller;

import com.sass.kb.common.annotation.RequirePermission;
import com.sass.kb.common.result.R;
import com.sass.kb.doc.entity.Folder;
import com.sass.kb.doc.service.FolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folder")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @PostMapping
    public R<Folder> create(@Valid @RequestBody Folder folder) {
        return R.ok(folderService.create(folder));
    }

    @PutMapping("/{id}")
    @RequirePermission(resource = "folder", action = "write")
    public R<Folder> update(@PathVariable String id, @RequestBody Folder folder) {
        return R.ok(folderService.update(id, folder));
    }

    @DeleteMapping("/{id}")
    @RequirePermission(resource = "folder", action = "delete")
    public R<Void> delete(@PathVariable String id) {
        folderService.delete(id);
        return R.ok();
    }

    @PutMapping("/{id}/move")
    @RequirePermission(resource = "folder", action = "write")
    public R<Void> move(@PathVariable String id, @RequestParam String targetParentId) {
        folderService.move(id, targetParentId);
        return R.ok();
    }

    @PutMapping("/sort")
    public R<Void> sort(@RequestBody List<FolderService.SortItem> items) {
        folderService.sort(items);
        return R.ok();
    }
}
