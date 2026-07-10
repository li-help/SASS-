package com.zhentao.auth.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhentao.auth.entity.User;
import com.zhentao.auth.mapper.UserMapper;
import com.zhentao.auth.util.JwtUtil;
import com.zhentao.common.result.R;
import com.zhentao.common.context.TenantContext;
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
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String token = extractToken(request);
        if (token == null) {
            writeUnauthorized(response, "未登录，请先登录");
            return false;
        }
        try {
            String userId = jwtUtil.getUserId(token);
            String tenantId = jwtUtil.getTenantId(token);
            User user = userMapper.selectById(userId);
            if (user == null) {
                writeUnauthorized(response, "用户不存在");
                return false;
            }
            if (!"active".equals(user.getStatus())) {
                writeForbidden(response, "账号已被禁用");
                return false;
            }
            request.setAttribute("userId", userId);
            request.setAttribute("tenantId", tenantId);
            TenantContext.setCurrentTenantId(tenantId);
            request.setAttribute("username", user.getUsername());
            request.setAttribute("isSuperAdmin", Boolean.TRUE.equals(user.getIsSuperAdmin()));
            return true;
        } catch (Exception e) {
            writeUnauthorized(response, "令牌无效或已过期");
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

    private void writeUnauthorized(HttpServletResponse response, String message) {
        response.setStatus(401);
        response.setContentType("application/json;charset=UTF-8");
        try {
            response.getWriter().write(objectMapper.writeValueAsString(R.fail(401, message)));
        } catch (Exception ignored) {
        }
    }

    private void writeForbidden(HttpServletResponse response, String message) {
        response.setStatus(403);
        response.setContentType("application/json;charset=UTF-8");
        try {
            response.getWriter().write(objectMapper.writeValueAsString(R.fail(403, message)));
        } catch (Exception ignored) {
        }
    }
}
