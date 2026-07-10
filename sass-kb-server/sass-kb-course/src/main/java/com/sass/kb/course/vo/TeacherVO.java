package com.sass.kb.course.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TeacherVO {
    private String id;
    private String teacherName;
    private String avatar;
    private String title;
    private String intro;
    private Integer sort;
    private Integer status;
    private LocalDateTime createdAt;
}
