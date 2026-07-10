package com.sass.kb.config;

import com.sass.kb.tenant.context.TenantContext;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;

/**
 * 替代原 AuthInterceptor，从 Gateway 注入的 Header 读取身份信息。
 * Gateway 的 AuthGlobalFilter 已完成 JWT 验签，
 * 将 userId / tenantId 写入 X-User-Id / X-Tenant-Id Header。
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class GatewayHeaderFilter implements Filter {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_TENANT_ID = "X-Tenant-Id";

    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) resp;

        // CORS 预检放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(req, resp);
            return;
        }

        String userId = request.getHeader(HEADER_USER_ID);
        String tenantId = request.getHeader(HEADER_TENANT_ID);

        if (StringUtils.hasText(userId)) {
            request.setAttribute("userId", userId);
            request.setAttribute("tenantId", tenantId != null ? tenantId : "");
            TenantContext.setCurrentTenantId(tenantId);
            request.setAttribute("username", userId);
            // 超管标识：Gateway 不传此字段，由业务服务自行判断
            request.setAttribute("isSuperAdmin", false);
        }
        // 直接访问（绕过 Gateway）时不强制要求认证，由业务自行判断

        try {
            chain.doFilter(req, resp);
        } finally {
            TenantContext.clear();
        }
    }
}
