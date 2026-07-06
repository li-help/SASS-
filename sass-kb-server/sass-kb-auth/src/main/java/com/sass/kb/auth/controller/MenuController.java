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
        List<Menu> created = new java.util.ArrayList<>();

        Long count = menuMapper.selectCount(new LambdaQueryWrapper<Menu>()
                .eq(Menu::getTenantId, tenantId));
        if (count > 0) {
            return R.ok(created);
        }

        // 1. 工作台（目录）
        Menu dashboard = new Menu();
        dashboard.setId(IdUtil.fastSimpleUUID());
        dashboard.setTenantId(tenantId);
        dashboard.setName("工作台");
        dashboard.setMenuType("M");
        dashboard.setPath("/dashboard");
        dashboard.setIcon("DashboardOutlined");
        dashboard.setSortOrder(1);
        dashboard.setVisible(true);
        dashboard.setStatus("0");
        menuMapper.insert(dashboard);
        created.add(dashboard);

        // 2. 文件管理（目录）
        Menu file = new Menu();
        file.setId(IdUtil.fastSimpleUUID());
        file.setTenantId(tenantId);
        file.setName("文件管理");
        file.setMenuType("M");
        file.setPath("/file");
        file.setIcon("FileOutlined");
        file.setSortOrder(2);
        file.setVisible(true);
        file.setStatus("0");
        menuMapper.insert(file);
        created.add(file);

        // 3. 用户管理（菜单）
        Menu user = new Menu();
        user.setId(IdUtil.fastSimpleUUID());
        user.setTenantId(tenantId);
        user.setName("用户管理");
        user.setMenuType("C");
        user.setPath("/user");
        user.setComponent("user/index");
        user.setPerms("system:user:list");
        user.setIcon("UserOutlined");
        user.setSortOrder(3);
        user.setVisible(true);
        user.setStatus("0");
        menuMapper.insert(user);
        created.add(user);

        // 4. 角色权限（菜单）
        Menu role = new Menu();
        role.setId(IdUtil.fastSimpleUUID());
        role.setTenantId(tenantId);
        role.setName("角色权限");
        role.setMenuType("C");
        role.setPath("/role");
        role.setComponent("role/index");
        role.setPerms("system:role:list");
        role.setIcon("SafetyOutlined");
        role.setSortOrder(4);
        role.setVisible(true);
        role.setStatus("0");
        menuMapper.insert(role);
        created.add(role);

        // 5. 租户管理（菜单）
        Menu tenant = new Menu();
        tenant.setId(IdUtil.fastSimpleUUID());
        tenant.setTenantId(tenantId);
        tenant.setName("租户管理");
        tenant.setMenuType("C");
        tenant.setPath("/tenant");
        tenant.setComponent("tenant/index");
        tenant.setPerms("system:tenant:list");
        tenant.setIcon("TeamOutlined");
        tenant.setSortOrder(5);
        tenant.setVisible(true);
        tenant.setStatus("0");
        menuMapper.insert(tenant);
        created.add(tenant);

        // 6. 入驻审核（菜单）
        Menu onboarding = new Menu();
        onboarding.setId(IdUtil.fastSimpleUUID());
        onboarding.setTenantId(tenantId);
        onboarding.setName("入驻审核");
        onboarding.setMenuType("C");
        onboarding.setPath("/onboarding-review");
        onboarding.setComponent("onboarding-review/index");
        onboarding.setPerms("system:onboarding:list");
        onboarding.setIcon("ShopOutlined");
        onboarding.setSortOrder(6);
        onboarding.setVisible(true);
        onboarding.setStatus("0");
        menuMapper.insert(onboarding);
        created.add(onboarding);

        // 7. 菜单管理（菜单）
        Menu menuMgr = new Menu();
        menuMgr.setId(IdUtil.fastSimpleUUID());
        menuMgr.setTenantId(tenantId);
        menuMgr.setName("菜单管理");
        menuMgr.setMenuType("C");
        menuMgr.setPath("/menu");
        menuMgr.setComponent("menu/index");
        menuMgr.setPerms("system:menu:list");
        menuMgr.setIcon("MenuOutlined");
        menuMgr.setSortOrder(7);
        menuMgr.setVisible(true);
        menuMgr.setStatus("0");
        menuMapper.insert(menuMgr);
        created.add(menuMgr);

        return R.ok(created);
    }
}
