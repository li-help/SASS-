package com.sass.kb.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CourseUpdateDTO {
    @NotNull(message = "课程ID不能为空")
    private String id;
    @NotBlank(message = "课程名称不能为空")
    private String courseName;
    private String categoryId;
    private String teacherId;
    private String cover;
    private String introduce;
    private Integer totalChapter;
    private Integer totalDuration;
    private Integer originalPrice;
    private Integer currentPrice;
    private Integer difficulty;
    private Integer status;
    private Integer sort;
}
