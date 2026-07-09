package com.sass.kb.auth.listener;

import cn.hutool.core.util.IdUtil;
import com.sass.kb.common.entity.AuditLog;
import com.sass.kb.common.mapper.AuditLogMapper;
import com.sass.kb.common.event.EntityEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditEventListener {

    private final AuditLogMapper auditLogMapper;

    @Async
    @EventListener
    public void handleEntityEvent(EntityEvent event) {
        try {
            AuditLog log = new AuditLog();
            log.setId(IdUtil.fastSimpleUUID());
            log.setTenantId(event.getTenantId());
            log.setAction(event.getType());
            log.setTargetType(event.getEntityType());
            log.setTargetId(event.getEntityId());
            log.setDetail(event.getType() + " " + event.getEntityType() + ":" + event.getEntityId());
            log.setCreatedAt(LocalDateTime.now());
            auditLogMapper.insert(log);
        } catch (Exception e) {
            log.warn("审计日志写入失败: {}", e.getMessage());
        }
    }
}
