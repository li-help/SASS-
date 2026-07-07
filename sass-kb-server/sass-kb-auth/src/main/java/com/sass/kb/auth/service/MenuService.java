package com.sass.kb.auth.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.entity.Menu;
import com.sass.kb.auth.mapper.MenuMapper;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuMapper menuMapper;

    public List<Menu> buildTree() {
        String tenantId = TenantContext.getCurrentTenantId();
        List<Menu> all = menuMapper.selectList(new LambdaQueryWrapper<Menu>()
                .eq(Menu::getTenantId, tenantId)
                .orderByAsc(Menu::getSortOrder));

        Map<String, List<Menu>> byParent = all.stream()
                .collect(Collectors.groupingBy(m -> m.getParentId() == null ? "" : m.getParentId()));

        List<Menu> roots = byParent.getOrDefault("", new ArrayList<>());
        roots.sort(Comparator.comparingInt(m -> m.getSortOrder() != null ? m.getSortOrder() : 0));

        for (Menu root : roots) {
            attachChildren(root, byParent);
        }
        return roots;
    }

    private void attachChildren(Menu parent, Map<String, List<Menu>> byParent) {
        List<Menu> children = byParent.getOrDefault(parent.getId(), new ArrayList<>());
        children.sort(Comparator.comparingInt(m -> m.getSortOrder() != null ? m.getSortOrder() : 0));
        parent.setChildren(children);
        for (Menu child : children) {
            attachChildren(child, byParent);
        }
    }

    public List<Menu> initDefaultMenus(String tenantId) {
        List<Menu> created = new ArrayList<>();

        Long count = menuMapper.selectCount(new LambdaQueryWrapper<Menu>()
                .eq(Menu::getTenantId, tenantId));
        if (count > 0) {
            return created;
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

        return created;
    }

    @Transactional
    public void deleteRecursive(String id) {
        List<Menu> children = menuMapper.selectList(new LambdaQueryWrapper<Menu>()
                .eq(Menu::getParentId, id));
        for (Menu child : children) {
            deleteRecursive(child.getId());
        }
        menuMapper.deleteById(id);
    }
}
