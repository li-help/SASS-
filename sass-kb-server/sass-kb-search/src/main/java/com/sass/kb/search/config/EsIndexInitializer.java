package com.sass.kb.search.config;

import com.sass.kb.search.model.DocDocument;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EsIndexInitializer {

    private final ElasticsearchOperations elasticsearchOperations;

    @PostConstruct
    public void initIndex() {
        try {
            IndexOperations indexOps = elasticsearchOperations.indexOps(DocDocument.class);
            if (!indexOps.exists()) {
                log.info("ES index 'documents' does not exist, creating it...");
                indexOps.create();
                indexOps.putMapping(indexOps.createMapping(DocDocument.class));
                log.info("ES index 'documents' mapping applied successfully.");
            } else {
                log.info("ES index 'documents' already exists, skipping creation.");
            }
        } catch (Exception e) {
            log.error("Failed to initialize ES index 'documents'", e);
        }
    }
}
