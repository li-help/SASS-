package com.sass.kb.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CoursePeriodUpdateDTO {
    @NotNull(message = "课时ID不能为空")
    private String id;
    @NotBlank(message = "课时名称不能为空")
    private String periodName;
    private String periodDesc;
    private Integer periodType;
    private Integer duration;
    private String resourceUrl;
    private Integer isFree;
    private Integer sort;
}
