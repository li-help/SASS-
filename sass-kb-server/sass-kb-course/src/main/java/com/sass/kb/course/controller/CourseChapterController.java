package com.sass.kb.course.controller;

import com.sass.kb.common.result.R;
import com.sass.kb.course.dto.CourseChapterAddDTO;
import com.sass.kb.course.dto.CourseChapterUpdateDTO;
import com.sass.kb.course.service.CourseChapterService;
import com.sass.kb.course.vo.CourseChapterVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "课程章节管理")
@RestController
@RequestMapping("/api/course/chapter")
@RequiredArgsConstructor
public class CourseChapterController {

    private final CourseChapterService chapterService;

    @Operation(summary = "根据课程ID获取章节列表")
    @GetMapping("/list")
    public R<List<CourseChapterVO>> listByCourse(@RequestParam String courseId) {
        return R.ok(chapterService.listByCourseId(courseId));
    }

    @Operation(summary = "新增")
    @PostMapping
    public R<CourseChapterVO> create(@Validated @RequestBody CourseChapterAddDTO dto) {
        return R.ok(chapterService.create(dto));
    }

    @Operation(summary = "修改")
    @PutMapping("/{id}")
    public R<CourseChapterVO> update(@PathVariable String id,
                                      @Validated @RequestBody CourseChapterUpdateDTO dto) {
        dto.setId(id);
        return R.ok(chapterService.update(dto));
    }

    @Operation(summary = "删除（级联删除课时）")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        chapterService.delete(id);
        return R.ok();
    }
}
