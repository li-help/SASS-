package com.sass.kb.auth.controller;

import cn.hutool.core.util.IdUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.entity.Role;
import com.sass.kb.auth.mapper.RoleMapper;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.common.event.EntityEvent;
import com.sass.kb.common.event.EventPublisher;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.tenant.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final EventPublisher eventPublisher;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    private static final Set<String> VALID_STATUSES = Set.of("active", "disabled");

    private String generatePassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    @GetMapping("/list")
    public R<PageResult<User>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        String tenantId = TenantContext.getCurrentTenantId();
        LambdaQueryWrapper<User> qw = new LambdaQueryWrapper<>();
        if (tenantId != null && !tenantId.isBlank()) {
            qw.eq(User::getTenantId, tenantId);
        }
        if (keyword != null && !keyword.isBlank()) {
            qw.and(w -> w.like(User::getUsername, keyword)
                    .or().like(User::getRealName, keyword));
        }
        qw.orderByDesc(User::getCreatedAt);
        Page<User> p = userMapper.selectPage(new Page<>(page, size), qw);
        // 不返回 password_hash
        p.getRecords().forEach(u -> u.setPasswordHash(null));
        return R.ok(new PageResult<>(p.getRecords(), p.getTotal(), page, size));
    }

    @PostMapping
    public R<Map<String, Object>> create(@Valid @RequestBody User user, HttpServletRequest request) {
        String tenantId = TenantContext.getCurrentTenantId();
        // 重名校验
        if (userMapper.exists(new LambdaQueryWrapper<User>()
                .eq(User::getTenantId, tenantId)
                .eq(User::getUsername, user.getUsername()))) {
            throw new BizException("用户名已存在");
        }
        user.setId(IdUtil.fastSimpleUUID());
        user.setTenantId(tenantId);
        String rawPassword = generatePassword();
        user.setPasswordHash(BCrypt.hashpw(rawPassword));
        user.setStatus("active");
        user.setIsSuperAdmin(false);
        userMapper.insert(user);
        user.setPasswordHash(null);
        // 返回生成的明文密码（仅此一次可见）
        eventPublisher.publish(EntityEvent.of("CREATED", "USER", user.getId(), tenantId));
        return R.ok(Map.of("user", user, "initialPassword", rawPassword));
    }

    @PutMapping("/{id}")
    public R<Void> update(@PathVariable String id, @RequestBody User user) {
        String tenantId = TenantContext.getCurrentTenantId();
        // 租户隔离校验
        User existing = userMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "用户不存在");
        }
        if (tenantId != null && !tenantId.isBlank() && !tenantId.equals(existing.getTenantId())) {
            throw new BizException(403, "无权操作该用户");
        }
        user.setId(id);
        user.setPasswordHash(null); // 不允许直接改密码
        user.setIsSuperAdmin(null); // 不允许通过此接口修改超管标识
        user.setTenantId(null);     // 不允许切换租户
        userMapper.updateById(user);
        eventPublisher.publish(EntityEvent.of("UPDATED", "USER", id, tenantId));
        return R.ok();
    }

    @PutMapping("/{id}/status")
    public R<Void> toggleStatus(@PathVariable String id, @RequestParam String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new BizException(400, "无效的状态值，只允许 active 或 disabled");
        }
        String tenantId = TenantContext.getCurrentTenantId();
        User existing = userMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "用户不存在");
        }
        if (tenantId != null && !tenantId.isBlank() && !tenantId.equals(existing.getTenantId())) {
            throw new BizException(403, "无权操作该用户");
        }
        User u = new User();
        u.setId(id);
        u.setStatus(status);
        userMapper.updateById(u);
        eventPublisher.publish(EntityEvent.of("STATUS_CHANGED", "USER", id, tenantId));
        return R.ok();
    }

    @PutMapping("/{id}/password")
    public R<Map<String, String>> resetPassword(@PathVariable String id) {
        String tenantId = TenantContext.getCurrentTenantId();
        User existing = userMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "用户不存在");
        }
        if (tenantId != null && !tenantId.isBlank() && !tenantId.equals(existing.getTenantId())) {
            throw new BizException(403, "无权操作该用户");
        }
        String rawPassword = generatePassword();
        User u = new User();
        u.setId(id);
        u.setPasswordHash(BCrypt.hashpw(rawPassword));
        userMapper.updateById(u);
        return R.ok(Map.of("newPassword", rawPassword));
    }

    @GetMapping("/me")
    public R<User> me(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        User user = userMapper.selectById(userId);
        if (user != null) user.setPasswordHash(null);
        return R.ok(user);
    }

    @GetMapping("/me/roles")
    public R<List<String>> myRoles(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        List<Role> roles = roleMapper.selectByUserId(userId);
        List<String> roleNames = roles.stream().map(Role::getName).toList();
        return R.ok(roleNames);
    }

    @PutMapping("/me/update")
    public R<Void> updateMe(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        User user = userMapper.selectById(userId);
        if (user == null) throw new BizException(404, "用户不存在");

        if (body.containsKey("realName")) user.setRealName(body.get("realName"));
        if (body.containsKey("email")) user.setEmail(body.get("email"));
        if (body.containsKey("phone")) user.setPhone(body.get("phone"));

        // 修改密码需验证旧密码
        if (body.containsKey("newPassword")) {
            String oldPwd = body.get("oldPassword");
            if (oldPwd == null || !BCrypt.checkpw(oldPwd, user.getPasswordHash())) {
                return R.fail(400, "旧密码错误");
            }
            user.setPasswordHash(BCrypt.hashpw(body.get("newPassword")));
        }

        userMapper.updateById(user);
        return R.ok();
    }
}
