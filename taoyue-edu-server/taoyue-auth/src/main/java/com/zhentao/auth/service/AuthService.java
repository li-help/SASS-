package com.zhentao.auth.service;

import cn.hutool.core.util.IdUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zhentao.auth.dto.LoginRequest;
import com.zhentao.auth.dto.RefreshRequest;
import com.zhentao.auth.dto.RegisterRequest;
import com.zhentao.auth.dto.TokenResponse;
import com.zhentao.auth.entity.PermissionRule;
import com.zhentao.auth.entity.Role;
import com.zhentao.auth.entity.User;
import com.zhentao.auth.mapper.PermissionRuleMapper;
import com.zhentao.auth.mapper.UserMapper;
import com.zhentao.auth.util.JwtUtil;
import com.zhentao.common.exception.BizException;
import com.zhentao.auth.entity.Tenant;
import com.zhentao.auth.mapper.TenantMapper;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final TenantMapper tenantMapper;
    private final JwtUtil jwtUtil;
    private final RoleService roleService;
    private final PermissionRuleMapper permissionRuleMapper;

    public TokenResponse login(LoginRequest req) {
        LambdaQueryWrapper<User> qw = new LambdaQueryWrapper<User>().eq(User::getUsername, req.getAccount());
        if (req.getTenantId() != null && !req.getTenantId().isBlank()) {
            qw.eq(User::getTenantId, req.getTenantId());
        }
        List<User> users = userMapper.selectList(qw);
        if (users.isEmpty()) {
            throw new BizException(401, "账号或密码错误");
        }
        if (users.size() > 1) {
            throw new BizException(400, "存在多个同名账号，请指定租户ID进行登录");
        }
        User user = users.get(0);
        if (!BCrypt.checkpw(req.getPassword(), user.getPasswordHash())) {
            throw new BizException(401, "账号或密码错误");
        }
        if (!"active".equals(user.getStatus())) {
            throw new BizException(403, "账号已被禁用");
        }
        return buildLoginResult(user);
    }

    public TokenResponse refresh(RefreshRequest req) {
        Claims claims;
        try {
            claims = jwtUtil.validateToken(req.getRefreshToken());
        } catch (Exception e) {
            throw new BizException("刷新令牌无效或已过期");
        }
        if (!"refresh".equals(claims.get("type", String.class))) {
            throw new BizException("令牌类型错误，需要刷新令牌");
        }
        String userId = claims.getSubject();
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BizException("用户不存在");
        }
        if (!"active".equals(user.getStatus())) {
            throw new BizException(403, "账号已被禁用");
        }
        return buildLoginResult(user);
    }

    @Transactional
    public User register(RegisterRequest req) {
        String tenantName = (req.getCompanyName() != null && !req.getCompanyName().isBlank())
                ? req.getCompanyName() : "默认租户";
        String tenantId = resolveTenantId(tenantName);

        User user = new User();
        user.setId(IdUtil.fastSimpleUUID());
        user.setTenantId(tenantId);
        user.setUsername(req.getUsername());
        user.setPasswordHash(BCrypt.hashpw(req.getPassword()));
        user.setRealName(req.getRealName() != null ? req.getRealName() : req.getUsername());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setStatus("active");
        user.setIsSuperAdmin(false);
        try {
            userMapper.insert(user);
        } catch (DuplicateKeyException e) {
            throw new BizException("该用户名已存在");
        }

        try {
            roleService.initDefaultRoles(tenantId);
            Role normalRole = roleService.findByName(tenantId, "普通用户");
            PermissionRule pr = new PermissionRule();
            pr.setId(IdUtil.fastSimpleUUID());
            pr.setTenantId(tenantId);
            pr.setSubjectType("user");
            pr.setSubjectId(user.getId());
            pr.setTargetType("role");
            pr.setTargetId(normalRole.getId());
            pr.setAction("member");
            pr.setEffect("allow");
            permissionRuleMapper.insert(pr);
        } catch (Exception e) {
            log.warn("为新注册用户分配默认角色失败: userId={}, tenantId={}", user.getId(), tenantId);
        }

        return user;
    }

    private String resolveTenantId(String tenantName) {
        Tenant existing = tenantMapper.selectOne(
                new LambdaQueryWrapper<Tenant>().eq(Tenant::getName, tenantName));
        if (existing != null) {
            return existing.getId();
        }
        Tenant tenant = new Tenant();
        tenant.setId(IdUtil.fastSimpleUUID());
        tenant.setName(tenantName);
        tenant.setStatus("active");
        tenantMapper.insert(tenant);
        return tenant.getId();
    }

    private TokenResponse buildLoginResult(User user) {
        String userId = user.getId();
        String tenantId = user.getTenantId() != null ? user.getTenantId() : "";
        String accessToken = jwtUtil.generateAccessToken(userId, tenantId);
        String refreshToken = jwtUtil.generateRefreshToken(userId);
        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(userId)
                .realName(user.getRealName())
                .build();
    }
}
