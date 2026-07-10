package com.zhentao.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnClass(name = "io.swagger.v3.oas.models.OpenAPI")
public class SwaggerConfig {

    @Value("${spring.application.name:API接口文档}")
    private String applicationName;

    @Bean
    @ConditionalOnMissingBean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title(applicationName + " 接口文档")
                        .version("1.0.0")
                        .description("基于 Spring Boot 3 和 Knife4j (OpenAPI 3) 构建的微服务接口文档")
                        .contact(new Contact().name("振涛").email("admin@zhentao.com")));
    }
}
