package com.sass.kb.auth.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.auth.entity.AuditLog;
import com.sass.kb.auth.mapper.AuditLogMapper;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogMapper auditLogMapper;

    @GetMapping("/list")
    public R<PageResult<AuditLog>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String action) {
        String tenantId = TenantContext.getCurrentTenantId();
        LambdaQueryWrapper<AuditLog> qw = new LambdaQueryWrapper<>();
        if (tenantId != null && !tenantId.isBlank()) {
            qw.eq(AuditLog::getTenantId, tenantId);
        }
        if (targetType != null && !targetType.isBlank()) {
            qw.eq(AuditLog::getTargetType, targetType);
        }
        if (action != null && !action.isBlank()) {
            qw.eq(AuditLog::getAction, action);
        }
        qw.orderByDesc(AuditLog::getCreatedAt);
        Page<AuditLog> p = auditLogMapper.selectPage(new Page<>(page, size), qw);
        return R.ok(new PageResult<>(p.getRecords(), p.getTotal(), page, size));
    }
}
