package com.sass.kb.auth.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("\"user\"")
public class User {
    @TableId
    private String id;
    private String tenantId;
    private String username;
    private String passwordHash;
    private String realName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String status;
    private Boolean isSuperAdmin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
