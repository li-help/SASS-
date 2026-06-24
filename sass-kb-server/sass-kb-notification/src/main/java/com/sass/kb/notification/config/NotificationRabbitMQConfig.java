package com.sass.kb.notification.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NotificationRabbitMQConfig {

    @Bean
    public Queue notificationCommentQueue() {
        return new Queue("notification.comment", true);
    }
}
