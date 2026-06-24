package com.sass.kb.search.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Bean
    public Queue docChangeQueue() {
        return new Queue("doc.change", true);
    }
}
