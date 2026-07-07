package com.sass.kb.auth.controller;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.auth.entity.PermissionRule;
import com.sass.kb.auth.entity.Role;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.PermissionRuleMapper;
import com.sass.kb.auth.mapper.RoleMapper;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.auth.service.PermissionService;
import com.sass.kb.auth.service.RoleService;
import com.sass.kb.common.event.EntityEvent;
import com.sass.kb.common.event.EventPublisher;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/role")
@RequiredArgsConstructor
public class RoleController {

    private final RoleMapper roleMapper;
    private final PermissionRuleMapper permissionRuleMapper;
    private final UserMapper userMapper;
    private final PermissionService permissionService;
    private final RoleService roleService;
    private final EventPublisher eventPublisher;

    @GetMapping("/list")
    public R<PageResult<Role>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        String tenantId = TenantContext.getCurrentTenantId();
        LambdaQueryWrapper<Role> qw = new LambdaQueryWrapper<>();
        if (tenantId != null && !tenantId.isBlank()) {
            qw.eq(Role::getTenantId, tenantId);
        }
        if (keyword != null && !keyword.isBlank()) {
            qw.like(Role::getName, keyword);
        }
        qw.orderByDesc(Role::getCreatedAt);
        Page<Role> p = roleMapper.selectPage(new Page<>(page, size), qw);
        return R.ok(new PageResult<>(p.getRecords(), p.getTotal(), page, size));
    }

    @PostMapping
    public R<Role> create(@RequestBody Role role) {
        String tenantId = TenantContext.getCurrentTenantId();
        role.setId(IdUtil.fastSimpleUUID());
        role.setTenantId(tenantId);
        roleMapper.insert(role);
        eventPublisher.publish(EntityEvent.of("CREATED", "ROLE", role.getId(), tenantId));
        return R.ok(role);
    }

    @PutMapping("/{id}")
    public R<Void> update(@PathVariable String id, @RequestBody Role role) {
        Role existing = roleMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "角色不存在");
        }
        role.setId(id);
        roleMapper.updateById(role);
        permissionService.broadcastInvalidation(
                existing.getTenantId(), "role", id);
        eventPublisher.publish(EntityEvent.of("UPDATED", "ROLE", id, existing.getTenantId()));
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        Role existing = roleMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "角色不存在");
        }
        // Remove related permission_rules (membership)
        permissionRuleMapper.delete(new LambdaQueryWrapper<PermissionRule>()
                .eq(PermissionRule::getTargetType, "role")
                .eq(PermissionRule::getTargetId, id)
                .eq(PermissionRule::getAction, "member"));
        // Remove ACL rules that reference this role
        permissionRuleMapper.delete(new LambdaQueryWrapper<PermissionRule>()
                .eq(PermissionRule::getSubjectType, "role")
                .eq(PermissionRule::getSubjectId, id));
        roleMapper.deleteById(id);
        permissionService.broadcastInvalidation(
                existing.getTenantId(), "role", id);
        eventPublisher.publish(EntityEvent.of("DELETED", "ROLE", id, existing.getTenantId()));
        return R.ok();
    }

    @PostMapping("/{id}/assign")
    public R<Void> assignUsers(@PathVariable String id, @RequestBody List<String> userIds) {
        Role existing = roleMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "角色不存在");
        }
        String tenantId = TenantContext.getCurrentTenantId();
        for (String userId : userIds) {
            // Check if membership already exists
            Long count = permissionRuleMapper.selectCount(new LambdaQueryWrapper<PermissionRule>()
                    .eq(PermissionRule::getTenantId, tenantId)
                    .eq(PermissionRule::getSubjectType, "user")
                    .eq(PermissionRule::getSubjectId, userId)
                    .eq(PermissionRule::getTargetType, "role")
                    .eq(PermissionRule::getTargetId, id)
                    .eq(PermissionRule::getAction, "member"));
            if (count == 0) {
                PermissionRule pr = new PermissionRule();
                pr.setId(IdUtil.fastSimpleUUID());
                pr.setTenantId(tenantId);
                pr.setSubjectType("user");
                pr.setSubjectId(userId);
                pr.setTargetType("role");
                pr.setTargetId(id);
                pr.setAction("member");
                pr.setEffect("allow");
                permissionRuleMapper.insert(pr);
            }
        }
        permissionService.broadcastInvalidation(tenantId, "role", id);
        eventPublisher.publish(EntityEvent.of("UPDATED", "ROLE", id, tenantId));
        return R.ok();
    }

    @GetMapping("/{id}/members")
    public R<List<User>> getMembers(@PathVariable String id) {
        List<User> users = userMapper.selectByRoleId(id);
        users.forEach(u -> u.setPasswordHash(null));
        return R.ok(users);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public R<Void> removeMember(@PathVariable String id, @PathVariable String userId) {
        String tenantId = TenantContext.getCurrentTenantId();
        permissionRuleMapper.delete(new LambdaQueryWrapper<PermissionRule>()
                .eq(PermissionRule::getTenantId, tenantId)
                .eq(PermissionRule::getSubjectType, "user")
                .eq(PermissionRule::getSubjectId, userId)
                .eq(PermissionRule::getTargetType, "role")
                .eq(PermissionRule::getTargetId, id)
                .eq(PermissionRule::getAction, "member"));
        permissionService.broadcastInvalidation(tenantId, "role", id);
        eventPublisher.publish(EntityEvent.of("UPDATED", "ROLE", id, tenantId));
        return R.ok();
    }

    @PostMapping("/init-defaults")
    public R<List<Role>> initDefaults() {
        String tenantId = TenantContext.getCurrentTenantId();
        List<Role> created = roleService.initDefaultRoles(tenantId);
        if (!created.isEmpty()) {
            permissionService.invalidateCache();
        }
        return R.ok(created);
    }
}
