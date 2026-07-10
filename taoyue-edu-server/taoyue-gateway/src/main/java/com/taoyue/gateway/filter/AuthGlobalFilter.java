package com.taoyue.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

@Slf4j
@Component
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret:default-secret}")
    private String jwtSecret;

    private SecretKey signingKey;

    private static final List<String> WHITELIST = List.of(
            "/auth/login", "/auth/register", "/auth/refresh",
            "/v3/api-docs", "/doc.html", "/webjars",
            "/swagger-resources", "/swagger-ui"
    );

    @PostConstruct
    void init() {
        try {
            byte[] keyBytes = MessageDigest.getInstance("SHA-256")
                    .digest(jwtSecret.getBytes(StandardCharsets.UTF_8));
            signingKey = Keys.hmacShaKeyFor(keyBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("JWT key derivation failed", e);
        }
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // 白名单路径放行
        if (isWhitelist(path)) {
            return chain.filter(exchange);
        }

        // OPTIONS 预检放行
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequest().getMethod().name())) {
            return chain.filter(exchange);
        }

        String token = extractToken(exchange.getRequest());
        if (token == null) {
            return unauthorized(exchange, "未登录，请先登录");
        }

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // 只接受 access token
            if (!"access".equals(claims.get("type", String.class))) {
                return unauthorized(exchange, "令牌类型错误");
            }

            String userId = claims.getSubject();
            String tenantId = claims.get("tenantId", String.class);

            ServerHttpRequest mutated = exchange.getRequest().mutate()
                    .header("X-User-Id", userId != null ? userId : "")
                    .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                    .build();

            return chain.filter(exchange.mutate().request(mutated).build());
        } catch (Exception e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return unauthorized(exchange, "令牌无效或已过期");
        }
    }

    @Override
    public int getOrder() {
        return -100;
    }

    private boolean isWhitelist(String path) {
        return WHITELIST.stream().anyMatch(path::startsWith);
    }

    private String extractToken(ServerHttpRequest request) {
        String bearer = request.getHeaders().getFirst("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = String.format("{\"code\":401,\"message\":\"%s\",\"data\":null}", message);
        DataBuffer buffer = response.bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }
}
