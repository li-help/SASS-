package com.sass.kb.doc.controller;

import com.sass.kb.common.annotation.RequirePermission;
import com.sass.kb.common.event.EntityEvent;
import com.sass.kb.common.event.EventPublisher;
import com.sass.kb.common.result.R;
import com.sass.kb.doc.dto.SpaceTree;
import com.sass.kb.doc.entity.Space;
import com.sass.kb.doc.service.SpaceService;
import com.sass.kb.tenant.context.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/space")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;
    private final EventPublisher eventPublisher;

    @GetMapping("/list")
    public R<List<Space>> list(@RequestParam(required = false) String keyword) {
        return R.ok(spaceService.list(keyword));
    }

    @PostMapping
    public R<Space> create(@Valid @RequestBody Space space) {
        Space created = spaceService.create(space);
        eventPublisher.publish(EntityEvent.of("CREATED", "SPACE", created.getId(), TenantContext.getCurrentTenantId()));
        return R.ok(created);
    }

    @PutMapping("/{id}")
    @RequirePermission(resource = "space", action = "write")
    public R<Space> update(@PathVariable String id, @RequestBody Space space) {
        Space updated = spaceService.update(id, space);
        eventPublisher.publish(EntityEvent.of("UPDATED", "SPACE", id, TenantContext.getCurrentTenantId()));
        return R.ok(updated);
    }

    @DeleteMapping("/{id}")
    @RequirePermission(resource = "space", action = "admin")
    public R<Void> delete(@PathVariable String id) {
        spaceService.delete(id);
        eventPublisher.publish(EntityEvent.of("DELETED", "SPACE", id, TenantContext.getCurrentTenantId()));
        return R.ok();
    }

    @GetMapping("/{id}/tree")
    public R<List<SpaceTree>> tree(@PathVariable String id) {
        return R.ok(spaceService.getTree(id));
    }
}
