package com.zhentao.auth.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.zhentao.auth.config.JsonbTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName(value = "role", autoResultMap = true)
public class Role {

    @TableId
    private String id;
    private String tenantId;
    private String name;
    private String description;

    @TableField(typeHandler = JsonbTypeHandler.class)
    private String[] permissions;

    private String parentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
