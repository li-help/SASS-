package com.sass.kb.course.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TeacherAddDTO {
    @NotBlank(message = "讲师姓名不能为空")
    private String teacherName;
    private String avatar;
    private String title;
    private String intro;
    private Integer sort;
    private Integer status;
}
