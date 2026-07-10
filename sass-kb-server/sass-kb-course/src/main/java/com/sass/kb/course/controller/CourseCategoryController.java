package com.sass.kb.course.controller;

import com.sass.kb.common.result.R;
import com.sass.kb.course.dto.CourseCategoryAddDTO;
import com.sass.kb.course.dto.CourseCategoryUpdateDTO;
import com.sass.kb.course.service.CourseCategoryService;
import com.sass.kb.course.vo.CourseCategoryVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "课程分类管理")
@RestController
@RequestMapping("/api/course/category")
@RequiredArgsConstructor
public class CourseCategoryController {

    private final CourseCategoryService categoryService;

    @Operation(summary = "分类树")
    @GetMapping("/tree")
    public R<List<CourseCategoryVO>> tree() {
        return R.ok(categoryService.getTree());
    }

    @Operation(summary = "获取单个")
    @GetMapping("/{id}")
    public R<CourseCategoryVO> getById(@PathVariable String id) {
        return R.ok(categoryService.getById(id));
    }

    @Operation(summary = "新增")
    @PostMapping
    public R<CourseCategoryVO> create(@Validated @RequestBody CourseCategoryAddDTO dto) {
        return R.ok(categoryService.create(dto));
    }

    @Operation(summary = "修改")
    @PutMapping("/{id}")
    public R<CourseCategoryVO> update(@PathVariable String id,
                                       @Validated @RequestBody CourseCategoryUpdateDTO dto) {
        dto.setId(id);
        return R.ok(categoryService.update(dto));
    }

    @Operation(summary = "删除（级联删除子分类）")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        categoryService.delete(id);
        return R.ok();
    }
}
