package com.sass.kb.config;

import com.sass.kb.auth.util.JwtUtil;
import com.sass.kb.tenant.context.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@RequiredArgsConstructor
public class GatewayHeaderFilter implements Filter {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_TENANT_ID = "X-Tenant-Id";

    private final JwtUtil jwtUtil;

    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) resp;

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(req, resp);
            return;
        }

        String userId = request.getHeader(HEADER_USER_ID);
        String tenantId = request.getHeader(HEADER_TENANT_ID);

        // Fallback: extract from JWT Bearer token when no gateway headers
        if (!StringUtils.hasText(userId)) {
            String authHeader = request.getHeader("Authorization");
            if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                try {
                    String token = authHeader.substring(7);
                    Claims claims = jwtUtil.validateToken(token);
                    userId = claims.getSubject();
                    tenantId = claims.get("tenantId", String.class);
                } catch (Exception e) {
                    log.debug("JWT parse failed: {}", e.getMessage());
                }
            }
        }

        if (StringUtils.hasText(userId)) {
            request.setAttribute("userId", userId);
            request.setAttribute("tenantId", tenantId != null ? tenantId : "");
            TenantContext.setCurrentTenantId(tenantId);
            request.setAttribute("username", userId);
            request.setAttribute("isSuperAdmin", false);
        }

        try {
            chain.doFilter(req, resp);
        } finally {
            TenantContext.clear();
        }
    }
}
