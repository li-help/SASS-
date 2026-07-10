package com.sass.kb.course.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CoursePageQuery extends PageQuery {
    private String courseName;
    private String categoryId;
    private String teacherId;
    private Integer difficulty;
    private Integer status;
}
