package com.sass.kb.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CourseCategoryUpdateDTO {
    @NotNull(message = "分类ID不能为空")
    private String id;
    @NotBlank(message = "分类名称不能为空")
    private String catName;
    private String parentId;
    private Integer sort;
    private Integer status;
}
