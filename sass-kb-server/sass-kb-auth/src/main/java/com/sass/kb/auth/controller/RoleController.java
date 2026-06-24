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
        return R.ok();
    }

    @PostMapping("/init-defaults")
    public R<List<Role>> initDefaults() {
        String tenantId = TenantContext.getCurrentTenantId();
        List<Role> created = new java.util.ArrayList<>();

        // 只有租户下无角色时才初始化
        Long count = roleMapper.selectCount(new LambdaQueryWrapper<Role>()
                .eq(Role::getTenantId, tenantId));
        if (count > 0) {
            return R.ok(created); // 已有角色，跳过
        }

        // 管理员 - 拥有所有权限
        Role admin = new Role();
        admin.setId(IdUtil.fastSimpleUUID());
        admin.setTenantId(tenantId);
        admin.setName("管理员");
        admin.setDescription("拥有所有权限");
        admin.setPermissions(new String[]{"*:*"});
        roleMapper.insert(admin);
        created.add(admin);

        // 编辑者
        String editorId = IdUtil.fastSimpleUUID();
        Role editor = new Role();
        editor.setId(editorId);
        editor.setTenantId(tenantId);
        editor.setName("编辑者");
        editor.setDescription("可查看内容并编辑文档");
        editor.setPermissions(new String[]{
                "space:read", "doc:read", "doc:write",
                "file:read", "file:write",
        });
        roleMapper.insert(editor);
        created.add(editor);

        // 阅读者 - 继承编辑者的只读权限
        Role viewer = new Role();
        viewer.setId(IdUtil.fastSimpleUUID());
        viewer.setTenantId(tenantId);
        viewer.setName("阅读者");
        viewer.setDescription("仅可查看内容");
        viewer.setParentId(editorId); // 也可直接设置权限
        viewer.setPermissions(new String[]{
                "space:read", "doc:read", "file:read",
        });
        roleMapper.insert(viewer);
        created.add(viewer);

        permissionService.invalidateCache();
        return R.ok(created);
    }
}
