package com.zhentao.auth.controller;

import com.zhentao.auth.dto.LoginRequest;
import com.zhentao.auth.dto.RefreshRequest;
import com.zhentao.auth.dto.RegisterRequest;
import com.zhentao.auth.dto.TokenResponse;
import com.zhentao.auth.entity.User;
import com.zhentao.auth.service.AuthService;
import com.zhentao.common.event.EntityEvent;
import com.zhentao.common.event.EventPublisher;
import com.zhentao.common.result.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "认证", description = "登录、注册、Token 刷新")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EventPublisher eventPublisher;

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public R<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
        TokenResponse result = authService.login(req);
        return R.ok(result);
    }

    @Operation(summary = "刷新 Token")
    @PostMapping("/refresh")
    public R<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        TokenResponse result = authService.refresh(req);
        return R.ok(result);
    }

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public R<String> register(@Valid @RequestBody RegisterRequest req) {
        User user = authService.register(req);
        eventPublisher.publish(EntityEvent.of("CREATED", "USER", user.getId(), user.getTenantId()));
        return R.ok("注册成功，欢迎 " + user.getRealName());
    }
}
