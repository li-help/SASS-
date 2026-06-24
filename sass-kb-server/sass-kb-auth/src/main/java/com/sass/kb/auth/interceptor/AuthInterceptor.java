package com.sass.kb.auth.interceptor;

import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.auth.util.JwtUtil;
import com.sass.kb.tenant.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = extractToken(request);
        if (token == null) {
            response.setStatus(401);
            return false;
        }
        try {
            String userId = jwtUtil.getUserId(token);
            String tenantId = jwtUtil.getTenantId(token);
            request.setAttribute("userId", userId);
            request.setAttribute("tenantId", tenantId);
            TenantContext.setCurrentTenantId(tenantId);
            User user = userMapper.selectById(userId);
            request.setAttribute("username", user != null ? user.getUsername() : "unknown");
            request.setAttribute("isSuperAdmin", user != null && Boolean.TRUE.equals(user.getIsSuperAdmin()));
            return true;
        } catch (Exception e) {
            response.setStatus(401);
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        TenantContext.clear();
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
