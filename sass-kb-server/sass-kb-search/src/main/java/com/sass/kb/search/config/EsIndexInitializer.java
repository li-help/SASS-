package com.sass.kb.search.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!prod")  // 生产环境跳过 ES 索引初始化
public class EsIndexInitializer {

    @PostConstruct
    public void initIndex() {
        log.info("ES index initialization skipped (search uses PostgreSQL).");
    }
}
