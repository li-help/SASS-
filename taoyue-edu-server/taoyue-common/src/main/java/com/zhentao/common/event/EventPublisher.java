package com.zhentao.common.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {

    @Async
    public void publish(EntityEvent event) {
        try {
            log.debug("Event published: type={}, entityType={}, entityId={}",
                    event.getType(), event.getEntityType(), event.getEntityId());
        } catch (Exception e) {
            log.warn("Failed to publish event: {}", e.getMessage());
        }
    }
}
