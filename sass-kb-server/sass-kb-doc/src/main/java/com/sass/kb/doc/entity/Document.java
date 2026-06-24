package com.sass.kb.doc.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("document")
public class Document {

    @TableId
    private String id;
    private String spaceId;
    private String folderId;
    private String tenantId;
    private String title;
    private String contentJson;
    private String contentHtml;
    private String status;
    private Integer version;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
