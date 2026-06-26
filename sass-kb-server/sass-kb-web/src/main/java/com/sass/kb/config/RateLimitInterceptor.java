package com.sass.kb.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sass.kb.common.result.R;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final DefaultRedisScript<Long> INCR_WITH_EXPIRE = new DefaultRedisScript<>(
            "local v = redis.call('INCR', KEYS[1]); " +
            "if v == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; " +
            "return v", Long.class);

    @org.springframework.beans.factory.annotation.Value("${app.rate-limit.max-requests:100}")
    private int rateLimit;

    private final Cache<String, Long> localRateLimitCache = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(10000)
            .build();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String clientIp = getClientIp(request);
        String key = "rate:" + clientIp + ":" + request.getRequestURI();
        try {
            Long count = redisTemplate.execute(INCR_WITH_EXPIRE, List.of(key), "60");
            if (count != null && count > rateLimit) {
                writeRateLimited(response);
                return false;
            }
        } catch (Exception e) {
            log.warn("Redis is unavailable for rate limiting, falling back to local Caffeine cache: {}", e.getMessage());
            long count = localRateLimitCache.get(key, k -> 0L) + 1;
            localRateLimitCache.put(key, count);
            if (count > rateLimit) {
                writeRateLimited(response);
                return false;
            }
        }
        return true;
    }

    private void writeRateLimited(HttpServletResponse response) {
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");
        try {
            response.getWriter().write(objectMapper.writeValueAsString(
                    R.fail(429, "请求过于频繁，请稍后再试")));
        } catch (Exception ignored) {
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(xRealIp)) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
