package com.sass.kb.common.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    @Async
    public void publish(EntityEvent event) {
        try {
            messagingTemplate.convertAndSend("/topic/entity-changes", event);
            log.debug("Event published: type={}, entityType={}, entityId={}",
                    event.getType(), event.getEntityType(), event.getEntityId());
        } catch (Exception e) {
            log.warn("Failed to publish event: {}", e.getMessage());
        }
    }
}
