package com.sass.kb.auth.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.common.entity.AuditLog;
import com.sass.kb.common.mapper.AuditLogMapper;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.tenant.context.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "审计日志", description = "操作审计日志查询")
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogMapper auditLogMapper;

    @Operation(summary = "获取审计日志列表")
    @GetMapping("/list")
    public R<PageResult<AuditLog>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String targetType) {
        String tenantId = TenantContext.getCurrentTenantId();
        LambdaQueryWrapper<AuditLog> qw = new LambdaQueryWrapper<>();
        if (tenantId != null && !tenantId.isBlank()) {
            qw.eq(AuditLog::getTenantId, tenantId);
        }
        if (action != null && !action.isBlank()) {
            qw.eq(AuditLog::getAction, action);
        }
        if (userId != null && !userId.isBlank()) {
            qw.eq(AuditLog::getUserId, userId);
        }
        if (targetType != null && !targetType.isBlank()) {
            qw.eq(AuditLog::getTargetType, targetType);
        }
        qw.orderByDesc(AuditLog::getCreatedAt);
        Page<AuditLog> p = auditLogMapper.selectPage(new Page<>(page, size), qw);
        return R.ok(new PageResult<>(p.getRecords(), p.getTotal(), page, size));
    }
}
