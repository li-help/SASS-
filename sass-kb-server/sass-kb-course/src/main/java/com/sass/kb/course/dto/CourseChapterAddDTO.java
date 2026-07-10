package com.sass.kb.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CourseChapterAddDTO {
    @NotNull(message = "课程ID不能为空")
    private String courseId;
    @NotBlank(message = "章节名称不能为空")
    private String chapterName;
    private String chapterDesc;
    private Integer sort;
}
