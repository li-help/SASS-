package com.sass.kb.course.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CoursePeriodVO {
    private String id;
    private String chapterId;
    private String courseId;
    private String periodName;
    private String periodDesc;
    private Integer periodType;
    private Integer duration;
    private String resourceUrl;
    private Integer isFree;
    private Integer sort;
}
