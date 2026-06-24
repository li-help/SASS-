package com.sass.kb.collaboration.controller;

import com.sass.kb.collaboration.dto.DiffResult;
import com.sass.kb.collaboration.service.DiffService;
import com.sass.kb.common.result.R;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/diff")
@RequiredArgsConstructor
public class DiffController {

    private final DiffService diffService;

    @GetMapping("/{docId}")
    public R<DiffResult> diff(@PathVariable String docId,
                               @RequestParam int v1,
                               @RequestParam int v2) {
        return R.ok(diffService.diff(docId, v1, v2));
    }
}
