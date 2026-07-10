package com.sass.kb.course.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("course_period")
public class CoursePeriod {
    @TableId
    private String id;
    private String courseId;
    private String chapterId;
    private String periodName;
    private String periodDesc;
    private Integer periodType;
    private Integer duration;
    private String resourceUrl;
    private Integer isFree;
    private Integer sort;
    private String tenantId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer deleted;
}
