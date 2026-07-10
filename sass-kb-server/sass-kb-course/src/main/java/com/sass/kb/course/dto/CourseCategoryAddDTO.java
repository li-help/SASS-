package com.sass.kb.course.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CourseCategoryAddDTO {
    @NotBlank(message = "分类名称不能为空")
    private String catName;
    private String parentId;
    private Integer sort;
    private Integer status;
}
