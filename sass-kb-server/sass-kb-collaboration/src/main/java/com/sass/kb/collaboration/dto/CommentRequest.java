package com.sass.kb.collaboration.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentRequest {
    @NotBlank
    private String documentId;
    @NotBlank
    private String content;
    private String parentId;
}
