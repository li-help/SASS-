package com.sass.kb.auth.controller;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.dto.LoginRequest;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.auth.util.JwtUtil;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.R;
import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "认证")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;

    @Operation(summary = "登录")
    @PostMapping("/login")
    public R<Map<String, Object>> login(@RequestBody LoginRequest req) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, req.getAccount()));
        if (user == null) {
            throw new BizException(401, "账号或密码错误");
        }
        if (!"active".equals(user.getStatus())) {
            throw new BizException(401, "账号已被禁用");
        }
        if (!BCrypt.checkpw(req.getPassword(), user.getPasswordHash())) {
            throw new BizException(401, "账号或密码错误");
        }

        String tenantId = user.getTenantId() != null ? user.getTenantId() : "";
        String accessToken = jwtUtil.generateAccessToken(user.getId(), tenantId);
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        return R.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "userId", user.getId(),
                "realName", user.getRealName() != null ? user.getRealName() : user.getUsername()
        ));
    }

    @Operation(summary = "刷新令牌")
    @PostMapping("/refresh")
    public R<Map<String, String>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BizException(401, "刷新令牌不能为空");
        }
        try {
            Claims claims = jwtUtil.validateToken(refreshToken);
            if (!"refresh".equals(claims.get("type"))) {
                throw new BizException(401, "无效的刷新令牌");
            }
            String userId = claims.getSubject();
            User user = userMapper.selectById(userId);
            if (user == null || !"active".equals(user.getStatus())) {
                throw new BizException(401, "用户不存在或已禁用");
            }
            String tenantId = user.getTenantId() != null ? user.getTenantId() : "";
            String newAccess = jwtUtil.generateAccessToken(userId, tenantId);
            String newRefresh = jwtUtil.generateRefreshToken(userId);
            return R.ok(Map.of("accessToken", newAccess, "refreshToken", newRefresh));
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            throw new BizException(401, "令牌无效或已过期");
        }
    }
}
