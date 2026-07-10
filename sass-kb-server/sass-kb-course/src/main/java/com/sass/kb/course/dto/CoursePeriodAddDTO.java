package com.sass.kb.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CoursePeriodAddDTO {
    @NotNull(message = "课程ID不能为空")
    private String courseId;
    @NotNull(message = "章节ID不能为空")
    private String chapterId;
    @NotBlank(message = "课时名称不能为空")
    private String periodName;
    private String periodDesc;
    private Integer periodType;
    private Integer duration;
    private String resourceUrl;
    private Integer isFree;
    private Integer sort;
}
