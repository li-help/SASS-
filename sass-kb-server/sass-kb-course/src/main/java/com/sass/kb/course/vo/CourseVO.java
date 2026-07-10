package com.sass.kb.course.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CourseVO {
    private String id;
    private String courseName;
    private String categoryId;
    private String categoryName;
    private String teacherId;
    private String teacherName;
    private String cover;
    private String introduce;
    private Integer totalChapter;
    private Integer totalDuration;
    private BigDecimal originalPrice;
    private BigDecimal currentPrice;
    private Integer studentCount;
    private Integer difficulty;
    private Integer status;
    private Integer sort;
    private LocalDateTime createdAt;
}
