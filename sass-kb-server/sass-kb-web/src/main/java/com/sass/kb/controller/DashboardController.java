package com.sass.kb.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.common.result.R;
import com.sass.kb.file.entity.FileAsset;
import com.sass.kb.file.mapper.FileAssetMapper;
import com.sass.kb.tenant.context.TenantContext;
import com.sass.kb.tenant.entity.Tenant;
import com.sass.kb.tenant.mapper.TenantMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@Tag(name = "仪表盘", description = "仪表盘统计信息")
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final FileAssetMapper fileAssetMapper;
    private final UserMapper userMapper;
    private final TenantMapper tenantMapper;

    @Operation(summary = "仪表盘统计")
    @GetMapping("/stats")
    @Cacheable(value = "dashboard:stats", key = "T(com.sass.kb.tenant.context.TenantContext).getCurrentTenantId() ?: 'global'")
    public R<Map<String, Object>> stats() {
        String tenantId = TenantContext.getCurrentTenantId();

        // 文件数
        long fileCount = fileAssetMapper.selectCount(new LambdaQueryWrapper<>());

        // 用户数
        LambdaQueryWrapper<User> userQw = new LambdaQueryWrapper<>();
        if (tenantId != null && !tenantId.isBlank()) {
            userQw.eq(User::getTenantId, tenantId);
        }
        long userCount = userMapper.selectCount(userQw);

        // 租户数
        long tenantCount = tenantMapper.selectCount(new LambdaQueryWrapper<>());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("files", fileCount);
        result.put("users", userCount);
        result.put("tenants", tenantCount);

        return R.ok(result);
    }
}
