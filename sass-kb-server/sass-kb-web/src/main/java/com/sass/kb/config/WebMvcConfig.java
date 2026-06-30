package com.sass.kb.config;

import com.sass.kb.auth.interceptor.AuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;
    private final RateLimitInterceptor rateLimitInterceptor;

    /**
     * 允许的跨域来源。可通过 app.cors.allowed-origins 配置（逗号分隔），
     * 对应 docker-compose 中的 APP_CORS_ALLOWED_ORIGINS 环境变量。
     * 默认覆盖本地开发（含 10.0.2.2，供 Android 模拟器访问宿主机）。
     */
    @Value("${app.cors.allowed-origins:http://localhost:*,http://127.0.0.1:*,http://10.0.2.2:*}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = allowedOrigins.split("\\s*,\\s*");
        registry.addMapping("/api/**")
                .allowedOriginPatterns(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/api/**")
                .order(0);
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/login", "/api/auth/refresh", "/api/auth/register",
                        "/api/onboarding/apply", "/api/onboarding/status",
                        "/v3/api-docs/**", "/doc.html", "/swagger-ui/**",
                        "/actuator/**", "/api/test/**", "/api/file/*/download-file")
                .order(1);
    }
}
