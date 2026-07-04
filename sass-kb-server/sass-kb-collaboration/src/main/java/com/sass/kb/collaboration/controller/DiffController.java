package com.sass.kb.collaboration.controller;

import com.sass.kb.collaboration.dto.DiffResult;
import com.sass.kb.collaboration.service.DiffService;
import com.sass.kb.common.result.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "版本对比", description = "文档版本差异对比")
@RestController
@RequestMapping("/api/diff")
@RequiredArgsConstructor
public class DiffController {

    private final DiffService diffService;

    @Operation(summary = "文档版本对比")
    @GetMapping("/{docId}")
    public R<DiffResult> diff(@PathVariable String docId,
                               @RequestParam int v1,
                               @RequestParam int v2) {
        return R.ok(diffService.diff(docId, v1, v2));
    }
}
