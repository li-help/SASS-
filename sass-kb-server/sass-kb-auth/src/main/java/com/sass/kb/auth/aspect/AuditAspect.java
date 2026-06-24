package com.sass.kb.auth.aspect;

import cn.hutool.core.util.IdUtil;
import com.sass.kb.common.annotation.AuditLog;
import com.sass.kb.common.mapper.AuditLogMapper;
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
public class AuditAspect {

    private final AuditLogMapper auditLogMapper;
    private final HttpServletRequest request;

    @Around("@annotation(auditLogAnnotation)")
    public Object recordAudit(ProceedingJoinPoint pjp, AuditLog auditLogAnnotation) throws Throwable {
        Object result = pjp.proceed();

        try {
            String userId = (String) request.getAttribute("userId");
            String tenantId = (String) request.getAttribute("tenantId");
            String username = (String) request.getAttribute("username");
            String targetId = resolveTargetId(auditLogAnnotation.targetIdExpr());
            String ip = getClientIp();

            com.sass.kb.common.entity.AuditLog log = new com.sass.kb.common.entity.AuditLog();
            log.setId(IdUtil.fastSimpleUUID());
            log.setTenantId(tenantId);
            log.setUserId(userId);
            log.setUsername(username != null ? username : userId);
            log.setAction(auditLogAnnotation.action());
            log.setTargetType(auditLogAnnotation.targetType());
            log.setTargetId(targetId);
            log.setIpAddress(ip);
            auditLogMapper.insert(log);
        } catch (Exception ignored) {
            // Audit failure should not break business logic
        }

        return result;
    }

    @SuppressWarnings("unchecked")
    private String resolveTargetId(String expr) {
        if ("#id".equals(expr)) {
            Map<String, String> pathVars = (Map<String, String>) request.getAttribute(
                    "org.springframework.web.servlet.HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE");
            if (pathVars != null) {
                return pathVars.get("id");
            }
        }
        return request.getParameter("id");
    }

    private String getClientIp() {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
