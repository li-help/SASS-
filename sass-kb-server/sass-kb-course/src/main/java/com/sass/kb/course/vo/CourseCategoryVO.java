package com.sass.kb.course.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CourseCategoryVO {
    private String id;
    private String catName;
    private String parentId;
    private Integer sort;
    private Integer status;
    private LocalDateTime createdAt;
    private List<CourseCategoryVO> children;
}
