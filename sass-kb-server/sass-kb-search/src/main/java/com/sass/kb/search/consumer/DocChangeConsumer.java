package com.sass.kb.search.consumer;

import com.sass.kb.doc.entity.Document;
import com.sass.kb.doc.mapper.DocumentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DocChangeConsumer {

    private final DocumentMapper documentMapper;

    @RabbitListener(queues = "doc.change")
    public void handleDocChange(String docId) {
        // PostgreSQL search reads directly from the document table,
        // so no sync is needed. This listener exists for future use.
        Document doc = documentMapper.selectByIdWithoutTenant(docId);
        if (doc != null) {
            log.debug("Document {} updated, search index is always up-to-date via PostgreSQL.", docId);
        }
    }
}
