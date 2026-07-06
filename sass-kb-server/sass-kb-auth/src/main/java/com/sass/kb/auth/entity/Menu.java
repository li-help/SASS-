package com.sass.kb.auth.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("menu")
public class Menu {

    @TableId
    private String id;
    private String tenantId;
    private String parentId;
    private String name;
    private String menuType;
    private String path;
    private String component;
    private String perms;
    private String icon;
    private Integer sortOrder;
    private Boolean visible;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @TableField(exist = false)
    private List<Menu> children;
}
