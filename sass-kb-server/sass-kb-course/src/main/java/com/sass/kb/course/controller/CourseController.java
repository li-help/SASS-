package com.sass.kb.course.controller;

import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.course.dto.CourseAddDTO;
import com.sass.kb.course.dto.CoursePageQuery;
import com.sass.kb.course.dto.CourseUpdateDTO;
import com.sass.kb.course.service.CourseService;
import com.sass.kb.course.vo.CourseDetailVO;
import com.sass.kb.course.vo.CourseVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Tag(name = "课程管理")
@RestController
@RequestMapping("/api/course/course")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @Operation(summary = "分页查询")
    @GetMapping("/list")
    public R<PageResult<CourseVO>> list(@Validated CoursePageQuery query) {
        return R.ok(courseService.pageQuery(query));
    }

    @Operation(summary = "根据ID获取详情（含章节和课时）")
    @GetMapping("/{id}")
    public R<CourseDetailVO> getById(@PathVariable String id) {
        return R.ok(courseService.getDetail(id));
    }

    @Operation(summary = "新增")
    @PostMapping
    public R<CourseVO> create(@Validated @RequestBody CourseAddDTO dto) {
        return R.ok(courseService.create(dto));
    }

    @Operation(summary = "修改")
    @PutMapping("/{id}")
    public R<CourseVO> update(@PathVariable String id, @Validated @RequestBody CourseUpdateDTO dto) {
        dto.setId(id);
        return R.ok(courseService.update(dto));
    }

    @Operation(summary = "删除（级联删除章节和课时）")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        courseService.delete(id);
        return R.ok();
    }
}
