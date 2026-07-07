package com.sass.kb;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableAsync;

@Slf4j
@SpringBootApplication
@EnableAspectJAutoProxy
@EnableCaching
@EnableAsync
@ComponentScan(basePackages = "com.sass.kb")
public class KbApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(KbApplication.class, args);
        log.info("=== BEANS COUNT: {} ===", context.getBeanDefinitionCount());
        String[] beanNames = context.getBeanNamesForType(Object.class);
        for (String name : beanNames) {
            if (name.toLowerCase().contains("controller")) {
                log.info("  - CONTROLLER BEAN: {}", name);
            }
        }
    }
}
