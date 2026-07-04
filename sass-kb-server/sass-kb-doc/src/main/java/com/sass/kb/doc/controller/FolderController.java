package com.sass.kb.doc.controller;

import com.sass.kb.common.annotation.RequirePermission;
import com.sass.kb.common.result.R;
import com.sass.kb.doc.entity.Folder;
import com.sass.kb.doc.service.FolderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "文件夹", description = "文件夹管理")
@RestController
@RequestMapping("/api/folder")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @Operation(summary = "创建文件夹")
    @PostMapping
    public R<Folder> create(@Valid @RequestBody Folder folder) {
        return R.ok(folderService.create(folder));
    }

    @Operation(summary = "更新文件夹")
    @PutMapping("/{id}")
    @RequirePermission(resource = "folder", action = "write")
    public R<Folder> update(@PathVariable String id, @RequestBody Folder folder) {
        return R.ok(folderService.update(id, folder));
    }

    @Operation(summary = "删除文件夹")
    @DeleteMapping("/{id}")
    @RequirePermission(resource = "folder", action = "delete")
    public R<Void> delete(@PathVariable String id) {
        folderService.delete(id);
        return R.ok();
    }

    @Operation(summary = "移动文件夹")
    @PutMapping("/{id}/move")
    @RequirePermission(resource = "folder", action = "write")
    public R<Void> move(@PathVariable String id, @RequestParam String targetParentId) {
        folderService.move(id, targetParentId);
        return R.ok();
    }

    @Operation(summary = "文件夹排序")
    @PutMapping("/sort")
    public R<Void> sort(@RequestBody List<FolderService.SortItem> items) {
        folderService.sort(items);
        return R.ok();
    }
}
