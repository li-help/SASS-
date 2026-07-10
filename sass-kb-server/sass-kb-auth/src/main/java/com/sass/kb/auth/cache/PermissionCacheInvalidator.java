package com.sass.kb.auth.cache;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

@Component
public class PermissionCacheInvalidator implements MessageListener {

    @Override
    public void onMessage(Message message, byte[] pattern) {
        // Handles Redis pub/sub messages for permission cache invalidation
    }
}
