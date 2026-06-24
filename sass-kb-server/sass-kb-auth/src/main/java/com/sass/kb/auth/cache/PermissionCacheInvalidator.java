package com.sass.kb.auth.cache;

import com.sass.kb.auth.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PermissionCacheInvalidator implements MessageListener {

    private final PermissionService permissionService;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String body = new String(message.getBody());
        log.debug("Permission cache invalidate: {}", body);
        permissionService.invalidateCache();
    }
}
