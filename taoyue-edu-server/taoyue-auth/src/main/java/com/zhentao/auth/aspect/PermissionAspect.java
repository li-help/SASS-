package com.zhentao.auth.aspect;

import com.zhentao.auth.service.PermissionService;
import com.zhentao.common.annotation.RequirePermission;
import com.zhentao.common.exception.BizException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
public class PermissionAspect {

    private final PermissionService permissionService;
    private final HttpServletRequest request;

    @Around("@annotation(requirePermission)")
    public Object checkPermission(ProceedingJoinPoint pjp, RequirePermission requirePermission) throws Throwable {
        String userId = (String) request.getAttribute("userId");
        String tenantId = (String) request.getAttribute("tenantId");
        Boolean isSuperAdmin = (Boolean) request.getAttribute("isSuperAdmin");

        if (userId == null) {
            throw new BizException(401, "未登录");
        }

        if (Boolean.TRUE.equals(isSuperAdmin)) {
            return pjp.proceed();
        }

        String resourceId = extractResourceId(requirePermission.targetIdParam());

        boolean allowed = permissionService.hasPermission(
                userId, tenantId, requirePermission.resource(),
                resourceId, requirePermission.action());

        if (!allowed) {
            throw new BizException(403, "没有操作权限");
        }

        return pjp.proceed();
    }

    @SuppressWarnings("unchecked")
    private String extractResourceId(String paramName) {
        Map<String, String> pathVariables = (Map<String, String>) request.getAttribute(
                "org.springframework.web.servlet.HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE");
        if (pathVariables != null) {
            return pathVariables.get(paramName);
        }
        return request.getParameter(paramName);
    }
}
