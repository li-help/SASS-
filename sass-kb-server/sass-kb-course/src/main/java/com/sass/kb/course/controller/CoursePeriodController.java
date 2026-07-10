package com.sass.kb.course.controller;

import com.sass.kb.common.result.R;
import com.sass.kb.course.dto.CoursePeriodAddDTO;
import com.sass.kb.course.dto.CoursePeriodUpdateDTO;
import com.sass.kb.course.service.CoursePeriodService;
import com.sass.kb.course.vo.CoursePeriodVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "课时管理")
@RestController
@RequestMapping("/api/course/period")
@RequiredArgsConstructor
public class CoursePeriodController {

    private final CoursePeriodService periodService;

    @Operation(summary = "根据章节ID获取课时列表")
    @GetMapping("/list")
    public R<List<CoursePeriodVO>> listByChapter(@RequestParam String chapterId) {
        return R.ok(periodService.listByChapterId(chapterId));
    }

    @Operation(summary = "新增")
    @PostMapping
    public R<CoursePeriodVO> create(@Validated @RequestBody CoursePeriodAddDTO dto) {
        return R.ok(periodService.create(dto));
    }

    @Operation(summary = "修改")
    @PutMapping("/{id}")
    public R<CoursePeriodVO> update(@PathVariable String id,
                                     @Validated @RequestBody CoursePeriodUpdateDTO dto) {
        dto.setId(id);
        return R.ok(periodService.update(dto));
    }

    @Operation(summary = "删除")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        periodService.delete(id);
        return R.ok();
    }
}
