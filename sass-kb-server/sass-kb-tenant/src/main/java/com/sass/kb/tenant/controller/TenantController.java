package com.sass.kb.tenant.controller;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.tenant.entity.Tenant;
import com.sass.kb.tenant.mapper.TenantMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenant")
@RequiredArgsConstructor
public class TenantController {

    private final TenantMapper tenantMapper;

    private void checkSuperAdmin(HttpServletRequest request) {
        Boolean isSuperAdmin = (Boolean) request.getAttribute("isSuperAdmin");
        if (!Boolean.TRUE.equals(isSuperAdmin)) {
            throw new BizException(403, "仅超级管理员可操作");
        }
    }

    @GetMapping("/list")
    public R<PageResult<Tenant>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            HttpServletRequest request) {
        checkSuperAdmin(request);
        LambdaQueryWrapper<Tenant> qw = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            qw.like(Tenant::getName, keyword);
        }
        qw.orderByDesc(Tenant::getCreatedAt);
        Page<Tenant> p = tenantMapper.selectPage(new Page<>(page, size), qw);
        return R.ok(new PageResult<>(p.getRecords(), p.getTotal(), page, size));
    }

    @PostMapping
    public R<Tenant> create(@Valid @RequestBody Tenant tenant, HttpServletRequest request) {
        checkSuperAdmin(request);
        tenant.setId(IdUtil.fastSimpleUUID());
        tenant.setStatus("active");
        tenantMapper.insert(tenant);
        return R.ok(tenant);
    }

    @PutMapping("/{id}")
    public R<Void> update(@PathVariable String id, @RequestBody Tenant tenant, HttpServletRequest request) {
        checkSuperAdmin(request);
        tenant.setId(id);
        tenantMapper.updateById(tenant);
        return R.ok();
    }

    @PutMapping("/{id}/status")
    public R<Void> toggleStatus(@PathVariable String id, @RequestParam String status, HttpServletRequest request) {
        checkSuperAdmin(request);
        Tenant t = new Tenant();
        t.setId(id);
        t.setStatus(status);
        tenantMapper.updateById(t);
        return R.ok();
    }
}
