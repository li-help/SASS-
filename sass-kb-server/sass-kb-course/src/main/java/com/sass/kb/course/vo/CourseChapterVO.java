package com.sass.kb.course.vo;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CourseChapterVO {
    private String id;
    private String courseId;
    private String chapterName;
    private String chapterDesc;
    private Integer periodCount;
    private Integer sort;
    private List<CoursePeriodVO> periods;
}
