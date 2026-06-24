package com.sass.kb.collaboration.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class CommentNode {
    private String id;
    private String documentId;
    private String parentId;
    private String content;
    private String createdBy;
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CommentNode> children = new ArrayList<>();
}
