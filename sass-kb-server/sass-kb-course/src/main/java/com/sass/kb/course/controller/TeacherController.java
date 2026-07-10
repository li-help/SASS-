package com.sass.kb.course.controller;

import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.course.dto.TeacherAddDTO;
import com.sass.kb.course.dto.TeacherUpdateDTO;
import com.sass.kb.course.service.TeacherService;
import com.sass.kb.course.vo.TeacherVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "讲师管理")
@RestController
@RequestMapping("/api/course/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    @Operation(summary = "分页列表")
    @GetMapping("/list")
    public R<PageResult<TeacherVO>> list(@RequestParam(required = false) String keyword,
                                          @RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "10") int size) {
        return R.ok(teacherService.pageQuery(keyword, page, size));
    }

    @Operation(summary = "获取全部（不分页）")
    @GetMapping("/all")
    public R<PageResult<TeacherVO>> all() {
        return R.ok(teacherService.pageQuery(null, 1, 999));
    }

    @Operation(summary = "根据ID获取")
    @GetMapping("/{id}")
    public R<TeacherVO> getById(@PathVariable String id) {
        return R.ok(teacherService.getById(id));
    }

    @Operation(summary = "新增")
    @PostMapping
    public R<TeacherVO> create(@Validated @RequestBody TeacherAddDTO dto) {
        return R.ok(teacherService.create(dto));
    }

    @Operation(summary = "修改")
    @PutMapping("/{id}")
    public R<TeacherVO> update(@PathVariable String id, @Validated @RequestBody TeacherUpdateDTO dto) {
        dto.setId(id);
        return R.ok(teacherService.update(dto));
    }

    @Operation(summary = "删除")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        teacherService.delete(id);
        return R.ok();
    }
}
