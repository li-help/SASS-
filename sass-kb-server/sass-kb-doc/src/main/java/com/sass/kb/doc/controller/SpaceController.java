package com.sass.kb.doc.controller;

import com.sass.kb.common.annotation.RequirePermission;
import com.sass.kb.common.event.EntityEvent;
import com.sass.kb.common.event.EventPublisher;
import com.sass.kb.common.result.R;
import com.sass.kb.doc.dto.SpaceTree;
import com.sass.kb.doc.entity.Space;
import com.sass.kb.doc.service.SpaceService;
import com.sass.kb.tenant.context.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "知识空间", description = "知识空间管理")
@RestController
@RequestMapping("/api/space")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;
    private final EventPublisher eventPublisher;

    @Operation(summary = "获取知识空间列表")
    @GetMapping("/list")
    public R<List<Space>> list(@RequestParam(required = false) String keyword) {
        return R.ok(spaceService.list(keyword));
    }

    @Operation(summary = "创建知识空间")
    @PostMapping
    public R<Space> create(@Valid @RequestBody Space space) {
        Space created = spaceService.create(space);
        eventPublisher.publish(EntityEvent.of("CREATED", "SPACE", created.getId(), TenantContext.getCurrentTenantId()));
        return R.ok(created);
    }

    @Operation(summary = "更新知识空间")
    @PutMapping("/{id}")
    @RequirePermission(resource = "space", action = "write")
    public R<Space> update(@PathVariable String id, @RequestBody Space space) {
        Space updated = spaceService.update(id, space);
        eventPublisher.publish(EntityEvent.of("UPDATED", "SPACE", id, TenantContext.getCurrentTenantId()));
        return R.ok(updated);
    }

    @Operation(summary = "删除知识空间")
    @DeleteMapping("/{id}")
    @RequirePermission(resource = "space", action = "admin")
    public R<Void> delete(@PathVariable String id) {
        spaceService.delete(id);
        eventPublisher.publish(EntityEvent.of("DELETED", "SPACE", id, TenantContext.getCurrentTenantId()));
        return R.ok();
    }

    @Operation(summary = "获取知识空间树形结构")
    @GetMapping("/{id}/tree")
    public R<List<SpaceTree>> tree(@PathVariable String id) {
        return R.ok(spaceService.getTree(id));
    }
}
