package com.sass.kb.file.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("file_asset")
public class FileAsset {

    @TableId
    private String id;
    private String tenantId;
    private String spaceId;
    private String originalName;
    private String storePath;
    private Long fileSize;
    private String mimeType;
    private String createdBy;
    private LocalDateTime createdAt;
}
