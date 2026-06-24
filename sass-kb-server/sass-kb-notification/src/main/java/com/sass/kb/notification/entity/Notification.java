package com.sass.kb.notification.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("notification")
public class Notification {

    @TableId
    private String id;
    private String tenantId;
    private String userId;
    private String type;
    private String title;
    private String content;
    private String targetType;
    private String targetId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
