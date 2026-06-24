package com.sass.kb.search.controller;

import com.sass.kb.common.result.R;
import com.sass.kb.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public R<Map<String, Object>> search(
            @RequestParam String q,
            @RequestParam(required = false) String spaceId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return R.ok(searchService.search(q, spaceId, page, size));
    }
}
