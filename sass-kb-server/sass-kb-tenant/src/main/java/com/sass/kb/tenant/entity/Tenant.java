package com.sass.kb.tenant.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("tenant")
public class Tenant {

    @TableId
    private String id;
    private String name;
    private String logoUrl;
    private String contactName;
    private String contactPhone;
    private Integer maxUserCount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
