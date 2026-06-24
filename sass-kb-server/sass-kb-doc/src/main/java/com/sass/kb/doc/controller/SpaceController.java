package com.sass.kb.doc.controller;

import com.sass.kb.common.annotation.RequirePermission;
import com.sass.kb.common.result.R;
import com.sass.kb.doc.dto.SpaceTree;
import com.sass.kb.doc.entity.Space;
import com.sass.kb.doc.service.SpaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/space")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;

    @GetMapping("/list")
    public R<List<Space>> list(@RequestParam(required = false) String keyword) {
        return R.ok(spaceService.list(keyword));
    }

    @PostMapping
    public R<Space> create(@Valid @RequestBody Space space) {
        return R.ok(spaceService.create(space));
    }

    @PutMapping("/{id}")
    @RequirePermission(resource = "space", action = "write")
    public R<Space> update(@PathVariable String id, @RequestBody Space space) {
        return R.ok(spaceService.update(id, space));
    }

    @DeleteMapping("/{id}")
    @RequirePermission(resource = "space", action = "admin")
    public R<Void> delete(@PathVariable String id) {
        spaceService.delete(id);
        return R.ok();
    }

    @GetMapping("/{id}/tree")
    public R<List<SpaceTree>> tree(@PathVariable String id) {
        return R.ok(spaceService.getTree(id));
    }
}
