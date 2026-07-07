package com.sass.kb.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketHandshakeInterceptor handshakeInterceptor;

    @Value("${app.cors.allowed-origins:http://localhost:*,http://127.0.0.1:*,http://10.0.2.2:*}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 客户端订阅前缀
        registry.enableSimpleBroker("/topic");
        // 服务端接收消息前缀（预留给将来）
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.split("\\s*,\\s*");
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins)
                .addInterceptors(handshakeInterceptor)
                .withSockJS();
    }
}
