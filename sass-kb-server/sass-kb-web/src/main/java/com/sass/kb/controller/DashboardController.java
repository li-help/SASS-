package com.sass.kb.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.common.result.R;
import com.sass.kb.doc.entity.Document;
import com.sass.kb.doc.entity.Space;
import com.sass.kb.doc.mapper.DocumentMapper;
import com.sass.kb.doc.mapper.SpaceMapper;
import com.sass.kb.file.entity.FileAsset;
import com.sass.kb.file.mapper.FileAssetMapper;
import com.sass.kb.tenant.context.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Tag(name = "仪表盘", description = "仪表盘统计信息")
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final SpaceMapper spaceMapper;
    private final DocumentMapper documentMapper;
    private final FileAssetMapper fileAssetMapper;
    private final UserMapper userMapper;

    @Operation(summary = "仪表盘统计")
    @GetMapping("/stats")
    @Cacheable(value = "dashboard:stats", key = "T(com.sass.kb.tenant.context.TenantContext).getCurrentTenantId() ?: 'global'")
    public R<Map<String, Object>> stats() {
        String tenantId = TenantContext.getCurrentTenantId();

        // 空间数（MyBatis Plus 自动租户隔离）
        long spaceCount = spaceMapper.selectCount(new LambdaQueryWrapper<>());

        // 文档数（自动租户隔离）
        long docCount = documentMapper.selectCount(new LambdaQueryWrapper<>());

        // 文件数（自动租户隔离）
        long fileCount = fileAssetMapper.selectCount(new LambdaQueryWrapper<>());

        // 用户数（user 表排除在租户隔离之外，需手动过滤）
        LambdaQueryWrapper<User> userQw = new LambdaQueryWrapper<>();
        if (tenantId != null && !tenantId.isBlank()) {
            userQw.eq(User::getTenantId, tenantId);
        }
        long userCount = userMapper.selectCount(userQw);

        // 最近更新的 5 篇文档
        LambdaQueryWrapper<Document> recentQw = new LambdaQueryWrapper<>();
        recentQw.orderByDesc(Document::getUpdatedAt);
        recentQw.last("LIMIT 5");
        List<Document> recentDocs = documentMapper.selectList(recentQw);

        List<Map<String, Object>> recentList = recentDocs.stream().map(doc -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", doc.getId());
            m.put("title", doc.getTitle());
            m.put("spaceId", doc.getSpaceId());
            m.put("status", doc.getStatus());
            m.put("updatedAt", doc.getUpdatedAt() != null ? doc.getUpdatedAt().toString() : null);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("spaces", spaceCount);
        result.put("docs", docCount);
        result.put("files", fileCount);
        result.put("users", userCount);
        result.put("recentDocs", recentList);

        return R.ok(result);
    }
}
