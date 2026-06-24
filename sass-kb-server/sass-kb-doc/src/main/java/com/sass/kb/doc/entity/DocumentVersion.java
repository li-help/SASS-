package com.sass.kb.doc.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("document_version")
public class DocumentVersion {

    @TableId
    private String id;
    private String documentId;
    private Integer versionNumber;
    private String contentJson;
    private String contentHtml;
    private String changeSummary;
    private String createdBy;
    private LocalDateTime createdAt;
}
