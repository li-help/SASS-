package com.sass.kb.search.consumer;

import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import com.sass.kb.doc.entity.Document;
import com.sass.kb.doc.mapper.DocumentMapper;
import com.sass.kb.search.model.DocDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DocChangeConsumer {

    private final DocumentMapper documentMapper;
    private final ElasticsearchOperations elasticsearchOperations;

    @RabbitListener(queues = "doc.change")
    public void handleDocChange(String docId) {
        log.info("Received doc.change event for docId: {}", docId);
        try {
            Document doc = documentMapper.selectByIdWithoutTenant(docId);
            if (doc == null) {
                try {
                    elasticsearchOperations.delete(docId, DocDocument.class);
                    log.info("Document {} deleted from ES", docId);
                } catch (ElasticsearchException e) {
                    if (e.getMessage() != null && e.getMessage().contains("document_missing_exception")) {
                        log.info("Document {} already absent from ES, skipping delete", docId);
                    } else {
                        throw e;
                    }
                }
            } else {
                DocDocument esDoc = toEsDocument(doc);
                elasticsearchOperations.save(esDoc);
                log.info("Document {} synced to ES", docId);
            }
        } catch (Exception e) {
            log.error("Failed to sync document {} to ES", docId, e);
        }
    }

    private DocDocument toEsDocument(Document doc) {
        DocDocument esDoc = new DocDocument();
        esDoc.setId(doc.getId());
        esDoc.setTitle(doc.getTitle());
        esDoc.setContentHtml(doc.getContentHtml());
        esDoc.setSpaceId(doc.getSpaceId());
        esDoc.setFolderId(doc.getFolderId());
        esDoc.setTenantId(doc.getTenantId());
        esDoc.setStatus(doc.getStatus());
        esDoc.setUpdatedBy(doc.getUpdatedBy());
        esDoc.setUpdatedAt(doc.getUpdatedAt());
        return esDoc;
    }
}
