package com.sass.kb.auth.controller;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.auth.entity.Menu;
import com.sass.kb.auth.mapper.MenuMapper;
import com.sass.kb.auth.service.MenuService;
import com.sass.kb.common.event.EntityEvent;
import com.sass.kb.common.event.EventPublisher;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuMapper menuMapper;
    private final MenuService menuService;
    private final EventPublisher eventPublisher;

    @GetMapping("/tree")
    public R<List<Menu>> tree() {
        return R.ok(menuService.buildTree());
    }

    @GetMapping("/list")
    public R<PageResult<Menu>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false) String keyword) {
        String tenantId = TenantContext.getCurrentTenantId();
        LambdaQueryWrapper<Menu> qw = new LambdaQueryWrapper<>();
        qw.eq(Menu::getTenantId, tenantId);
        if (keyword != null && !keyword.isBlank()) {
            qw.like(Menu::getName, keyword);
        }
        qw.orderByAsc(Menu::getSortOrder);
        Page<Menu> p = menuMapper.selectPage(new Page<>(page, size), qw);
        return R.ok(new PageResult<>(p.getRecords(), p.getTotal(), page, size));
    }

    @PostMapping
    public R<Menu> create(@RequestBody Menu menu) {
        String tenantId = TenantContext.getCurrentTenantId();
        menu.setId(IdUtil.fastSimpleUUID());
        menu.setTenantId(tenantId);
        if (menu.getMenuType() == null) {
            menu.setMenuType("M");
        }
        if (menu.getSortOrder() == null) {
            menu.setSortOrder(0);
        }
        if (menu.getVisible() == null) {
            menu.setVisible(true);
        }
        if (menu.getStatus() == null) {
            menu.setStatus("0");
        }
        menuMapper.insert(menu);
        eventPublisher.publish(EntityEvent.of("CREATED", "MENU", menu.getId(), tenantId));
        return R.ok(menu);
    }

    @PutMapping("/{id}")
    public R<Void> update(@PathVariable String id, @RequestBody Menu menu) {
        Menu existing = menuMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "菜单不存在");
        }
        menu.setId(id);
        menuMapper.updateById(menu);
        eventPublisher.publish(EntityEvent.of("UPDATED", "MENU", id, existing.getTenantId()));
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        Menu existing = menuMapper.selectById(id);
        if (existing == null) {
            throw new BizException(404, "菜单不存在");
        }
        menuService.deleteRecursive(id);
        eventPublisher.publish(EntityEvent.of("DELETED", "MENU", id, existing.getTenantId()));
        return R.ok();
    }

    @PostMapping("/init-defaults")
    public R<List<Menu>> initDefaults() {
        String tenantId = TenantContext.getCurrentTenantId();
        return R.ok(menuService.initDefaultMenus(tenantId));
    }
}
