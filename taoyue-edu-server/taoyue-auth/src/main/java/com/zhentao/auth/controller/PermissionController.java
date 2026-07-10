package com.zhentao.auth.controller;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zhentao.auth.entity.PermissionRule;
import com.zhentao.auth.mapper.PermissionRuleMapper;
import com.zhentao.auth.service.PermissionService;
import com.zhentao.common.annotation.AuditLog;
import com.zhentao.common.result.R;
import com.zhentao.common.context.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "权限管理", description = "权限规则管理")
@RestController
@RequestMapping("/permission")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionRuleMapper permissionRuleMapper;
    private final PermissionService permissionService;

    @Operation(summary = "获取权限规则列表")
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
        if (targetType != null) qw.eq(PermissionRule::getTargetType, targetType);
        if (targetId != null) qw.eq(PermissionRule::getTargetId, targetId);
        if (subjectType != null) qw.eq(PermissionRule::getSubjectType, subjectType);
        return R.ok(permissionRuleMapper.selectList(qw));
    }

    @Operation(summary = "创建权限规则")
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

    @Operation(summary = "更新权限规则")
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

    @Operation(summary = "删除权限规则")
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

    @Operation(summary = "批量创建权限规则")
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

    @Operation(summary = "批量删除权限规则")
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

    @Operation(summary = "检查权限")
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
