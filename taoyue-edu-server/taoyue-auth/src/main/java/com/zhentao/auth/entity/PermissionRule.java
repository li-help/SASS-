package com.zhentao.auth.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("permission_rule")
public class PermissionRule {

    @TableId
    private String id;
    private String tenantId;
    private String subjectType;
    private String subjectId;
    private String targetType;
    private String targetId;
    private String action;
    private String effect;
}
