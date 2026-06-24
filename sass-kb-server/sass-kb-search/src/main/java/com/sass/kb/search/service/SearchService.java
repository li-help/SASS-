package com.sass.kb.search.service;

import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import com.sass.kb.search.model.DocDocument;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    public Map<String, Object> search(String keyword, String spaceId, int page, int size) {
        String tenantId = TenantContext.getCurrentTenantId();

        // 构建 Bool Query
        BoolQuery.Builder boolBuilder = new BoolQuery.Builder();

        // 多字段搜索
        boolBuilder.must(Query.of(q -> q.multiMatch(mm -> mm
                .query(keyword)
                .fields("title^3", "contentHtml")
                .type(TextQueryType.BestFields))));

        // 只搜已发布文档
        boolBuilder.filter(Query.of(q -> q.term(t -> t.field("status").value("published"))));

        // 租户过滤
        BoolQuery.Builder tenantBuilder = new BoolQuery.Builder();
        if (tenantId != null && !tenantId.isBlank()) {
            tenantBuilder.should(Query.of(q -> q.term(t -> t.field("tenantId").value(""))));
            tenantBuilder.should(Query.of(q -> q.term(t -> t.field("tenantId").value(tenantId))));
        } else {
            tenantBuilder.should(Query.of(q -> q.term(t -> t.field("tenantId").value(""))));
        }
        boolBuilder.filter(Query.of(q -> q.bool(tenantBuilder.build())));

        // 空间过滤
        if (spaceId != null && !spaceId.isBlank()) {
            boolBuilder.filter(Query.of(q -> q.term(t -> t.field("spaceId").value(spaceId))));
        }

        NativeQuery query = NativeQuery.builder()
                .withQuery(Query.of(q -> q.bool(boolBuilder.build())))
                .withPageable(PageRequest.of(page - 1, size))
                .withTrackTotalHits(true)
                .build();

        SearchHits<DocDocument> hits = elasticsearchOperations.search(query, DocDocument.class);

        List<Map<String, Object>> records = new ArrayList<>();
        hits.forEach(hit -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", hit.getContent().getId());
            item.put("title", hit.getContent().getTitle());
            item.put("spaceId", hit.getContent().getSpaceId());
            item.put("updatedAt", hit.getContent().getUpdatedAt());
            item.put("score", hit.getScore());
            records.add(item);
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("records", records);
        result.put("total", hits.getTotalHits());
        result.put("page", page);
        result.put("size", size);
        return result;
    }
}
