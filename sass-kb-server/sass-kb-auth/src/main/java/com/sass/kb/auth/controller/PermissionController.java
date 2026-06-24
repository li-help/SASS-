package com.sass.kb.auth.controller;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.entity.PermissionRule;
import com.sass.kb.auth.mapper.PermissionRuleMapper;
import com.sass.kb.auth.service.PermissionService;
import com.sass.kb.common.annotation.AuditLog;
import com.sass.kb.common.result.R;
import com.sass.kb.tenant.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permission")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionRuleMapper permissionRuleMapper;
    private final PermissionService permissionService;

    @GetMapping("/rules")
    public R<List<PermissionRule>> listRules(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String targetId,
            @RequestParam(required = false) String subjectType) {
        String tenantId = TenantContext.getCurrentTenantId();
        LambdaQueryWrapper<PermissionRule> qw = new LambdaQueryWrapper<>();
        if (tenantId != null && !tenantId.isBlank()) {
            qw.eq(PermissionRule::getTenantId, tenantId);
        }
        if (targetType != null) {
            qw.eq(PermissionRule::getTargetType, targetType);
        }
        if (targetId != null) {
            qw.eq(PermissionRule::getTargetId, targetId);
        }
        if (subjectType != null) {
            qw.eq(PermissionRule::getSubjectType, subjectType);
        }
        return R.ok(permissionRuleMapper.selectList(qw));
    }

    @PostMapping("/rules")
    @AuditLog(action = "CREATE_PERMISSION", targetType = "permission")
    public R<PermissionRule> createRule(@RequestBody PermissionRule rule) {
        String tenantId = TenantContext.getCurrentTenantId();
        rule.setId(IdUtil.fastSimpleUUID());
        rule.setTenantId(tenantId);
        permissionRuleMapper.insert(rule);
        permissionService.broadcastInvalidation(tenantId,
                rule.getTargetType(), rule.getTargetId());
        return R.ok(rule);
    }

    @PutMapping("/rules/{id}")
    @AuditLog(action = "UPDATE_PERMISSION", targetType = "permission")
    public R<Void> updateRule(@PathVariable String id, @RequestBody PermissionRule rule) {
        rule.setId(id);
        permissionRuleMapper.updateById(rule);
        PermissionRule updated = permissionRuleMapper.selectById(id);
        if (updated != null) {
            permissionService.broadcastInvalidation(updated.getTenantId(),
                    updated.getTargetType(), updated.getTargetId());
        }
        return R.ok();
    }

    @DeleteMapping("/rules/{id}")
    @AuditLog(action = "DELETE_PERMISSION", targetType = "permission")
    public R<Void> deleteRule(@PathVariable String id) {
        PermissionRule rule = permissionRuleMapper.selectById(id);
        if (rule != null) {
            permissionRuleMapper.deleteById(id);
            permissionService.broadcastInvalidation(rule.getTenantId(),
                    rule.getTargetType(), rule.getTargetId());
        }
        return R.ok();
    }

    @PostMapping("/rules/batch")
    public R<List<PermissionRule>> createRules(@RequestBody List<PermissionRule> rules) {
        String tenantId = TenantContext.getCurrentTenantId();
        List<PermissionRule> created = new java.util.ArrayList<>();
        for (PermissionRule rule : rules) {
            rule.setId(IdUtil.fastSimpleUUID());
            rule.setTenantId(tenantId);
            permissionRuleMapper.insert(rule);
            created.add(rule);
            permissionService.broadcastInvalidation(tenantId,
                    rule.getTargetType(), rule.getTargetId());
        }
        return R.ok(created);
    }

    @DeleteMapping("/rules/batch")
    public R<Void> deleteRules(@RequestBody List<String> ids) {
        for (String id : ids) {
            PermissionRule rule = permissionRuleMapper.selectById(id);
            if (rule != null) {
                permissionRuleMapper.deleteById(id);
                permissionService.broadcastInvalidation(rule.getTenantId(),
                        rule.getTargetType(), rule.getTargetId());
            }
        }
        return R.ok();
    }

    @GetMapping("/check")
    public R<Map<String, Boolean>> check(
            @RequestParam String resourceType,
            @RequestParam String resourceId,
            @RequestParam String action,
            HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        String tenantId = (String) request.getAttribute("tenantId");
        Boolean isSuperAdmin = (Boolean) request.getAttribute("isSuperAdmin");

        boolean allowed;
        if (Boolean.TRUE.equals(isSuperAdmin)) {
            allowed = true;
        } else {
            allowed = permissionService.hasPermission(userId, tenantId,
                    resourceType, resourceId, action);
        }
        return R.ok(Map.of("allowed", allowed));
    }
}
