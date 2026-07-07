package com.sass.kb.config;

import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.auth.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            HttpServletRequest httpReq = servletRequest.getServletRequest();
            String token = httpReq.getParameter("token");

            if (token == null || token.isBlank()) {
                log.warn("WebSocket handshake rejected: missing token");
                return false;
            }

            try {
                Claims claims = jwtUtil.validateToken(token);
                String type = claims.get("type", String.class);
                if (!"access".equals(type)) {
                    log.warn("WebSocket handshake rejected: invalid token type");
                    return false;
                }
                String userId = claims.getSubject();
                User user = userMapper.selectById(userId);
                if (user == null || !"active".equals(user.getStatus())) {
                    log.warn("WebSocket handshake rejected: user not found or disabled");
                    return false;
                }
                attributes.put("userId", userId);
                attributes.put("tenantId", claims.get("tenantId", String.class));
                log.debug("WebSocket handshake OK: userId={}", userId);
                return true;
            } catch (Exception e) {
                log.warn("WebSocket handshake rejected: {}", e.getMessage());
                return false;
            }
        }
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
