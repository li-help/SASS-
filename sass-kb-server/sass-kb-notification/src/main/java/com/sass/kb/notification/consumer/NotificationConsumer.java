package com.sass.kb.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sass.kb.doc.entity.Document;
import com.sass.kb.doc.mapper.DocumentMapper;
import com.sass.kb.notification.entity.Notification;
import com.sass.kb.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import com.sass.kb.tenant.context.TenantContext;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationService notificationService;
    private final DocumentMapper documentMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @RabbitListener(queues = "notification.comment")
    public void handleCommentEvent(String message) {
        log.info("Received notification.comment event: {}", message);
        try {
            Map<String, Object> event = objectMapper.readValue(message, Map.class);
            String docId = (String) event.get("docId");
            String commenterId = (String) event.get("commenterId");
            String commenterName = (String) event.get("commenterName");

            Document doc = documentMapper.selectByIdWithoutTenant(docId);
            if (doc == null) return;

            String docOwnerId = doc.getCreatedBy();
            // Don't notify if commenter is the doc owner
            if (commenterId != null && commenterId.equals(docOwnerId)) return;

            Notification notif = new Notification();
            notif.setTenantId(doc.getTenantId());
            notif.setUserId(docOwnerId);
            notif.setType("comment");
            notif.setTitle(commenterName + " 评论了你的文档");
            notif.setContent(doc.getTitle());
            notif.setTargetType("doc");
            notif.setTargetId(docId);
            notif.setIsRead(false);
            
            try {
                TenantContext.setCurrentTenantId(doc.getTenantId());
                notificationService.create(notif);
            } finally {
                TenantContext.clear();
            }

            log.info("Created notification for user {}: comment on doc {}", docOwnerId, docId);
        } catch (Exception e) {
            log.error("Failed to process notification.comment event", e);
        }
    }
}
