package com.sass.kb.search.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.doc.entity.Document;
import com.sass.kb.doc.mapper.DocumentMapper;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final DocumentMapper documentMapper;

    public Map<String, Object> search(String keyword, String spaceId, int page, int size) {
        String tenantId = TenantContext.getCurrentTenantId();

        LambdaQueryWrapper<Document> wrapper = new LambdaQueryWrapper<>();

        // 关键词搜索：在标题和内容中搜索
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(Document::getTitle, keyword)
                    .or()
                    .like(Document::getContentHtml, keyword));
        }

        // 只搜已发布文档
        wrapper.eq(Document::getStatus, "published");

        // 空间过滤
        if (StringUtils.hasText(spaceId)) {
            wrapper.eq(Document::getSpaceId, spaceId);
        }

        // 按更新时间倒序
        wrapper.orderByDesc(Document::getUpdatedAt);

        Page<Document> result = documentMapper.selectPage(
                Page.of(page, size), wrapper);

        List<Map<String, Object>> records = result.getRecords().stream().map(doc -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", doc.getId());
            item.put("title", doc.getTitle());
            item.put("spaceId", doc.getSpaceId());
            item.put("updatedAt", doc.getUpdatedAt());
            // 简单评分：标题匹配权重更高
            float score = 1.0f;
            if (StringUtils.hasText(keyword) && doc.getTitle() != null
                    && doc.getTitle().toLowerCase().contains(keyword.toLowerCase())) {
                score = 3.0f;
            }
            item.put("score", score);
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> resultMap = new LinkedHashMap<>();
        resultMap.put("records", records);
        resultMap.put("total", result.getTotal());
        resultMap.put("page", page);
        resultMap.put("size", size);
        return resultMap;
    }
}
