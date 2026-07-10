package com.zhentao.auth;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(scanBasePackages = {"com.zhentao.auth", "com.zhentao.common"})
@MapperScan({"com.zhentao.auth.mapper", "com.zhentao.common.mapper"})
@EnableDiscoveryClient
@EnableAspectJAutoProxy
@EnableCaching
@EnableAsync
public class AuthApplication {
    public static void main(String[] args) {
        System.setProperty("JM.LOG.PATH", "logs/nacos");
        System.setProperty("csp.sentinel.log.dir", "logs/sentinel");
        SpringApplication.run(AuthApplication.class, args);
    }
}
