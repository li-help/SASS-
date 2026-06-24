package com.sass.kb.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class SecurityConfig {

    @Bean
    public FilterRegistrationBean<Filter> securityHeadersFilter() {
        Filter filter = (ServletFilter) (request, response, chain) -> {
            HttpServletResponse res = (HttpServletResponse) response;
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-Frame-Options", "DENY");
            res.setHeader("X-XSS-Protection", "0");
            res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
            chain.doFilter(request, response);
        };
        FilterRegistrationBean<Filter> reg = new FilterRegistrationBean<>();
        reg.setFilter(filter);
        reg.addUrlPatterns("/api/*");
        reg.setOrder(1);
        return reg;
    }

    @FunctionalInterface
    private interface ServletFilter extends Filter {
        @Override
        default void init(FilterConfig filterConfig) {}

        @Override
        default void destroy() {}
    }
}
