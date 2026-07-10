package com.sass.kb.course.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("course")
public class Course {
    @TableId
    private String id;
    private String courseName;
    private String categoryId;
    private String teacherId;
    private String cover;
    private String introduce;
    private Integer totalChapter;
    private Integer totalDuration;
    private Integer originalPrice;
    private Integer currentPrice;
    private Integer studentCount;
    private Integer difficulty;
    private Integer status;
    private Integer sort;
    private String tenantId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer deleted;
}
