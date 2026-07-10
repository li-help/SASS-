package com.sass.kb.course.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CourseDetailVO {
    private String id;
    private String courseName;
    private String categoryName;
    private String teacherName;
    private String teacherTitle;
    private String cover;
    private String introduce;
    private Integer totalChapter;
    private Integer totalDuration;
    private BigDecimal originalPrice;
    private BigDecimal currentPrice;
    private Integer studentCount;
    private Integer difficulty;
    private Integer status;
    private List<CourseChapterVO> chapters;
}
