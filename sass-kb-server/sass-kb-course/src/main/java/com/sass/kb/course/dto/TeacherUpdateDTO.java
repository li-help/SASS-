package com.sass.kb.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TeacherUpdateDTO {
    @NotNull(message = "讲师ID不能为空")
    private String id;
    @NotBlank(message = "讲师姓名不能为空")
    private String teacherName;
    private String avatar;
    private String title;
    private String intro;
    private Integer sort;
    private Integer status;
}
