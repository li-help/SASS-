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

        // 用固定 ID 确保幂等：每个菜单先查后插，已存在则跳过
        String[][] defaults = {
            {"dashboard", "工作台", "M", "/dashboard", null, null, "DashboardOutlined", "1"},
            {"file", "文件管理", "M", "/file", null, null, "FileOutlined", "2"},
            {"user", "用户管理", "C", "/user", "user/index", "system:user:list", "UserOutlined", "3"},
            {"role", "角色权限", "C", "/role", "role/index", "system:role:list", "SafetyOutlined", "4"},
            {"tenant", "租户管理", "C", "/tenant", "tenant/index", "system:tenant:list", "TeamOutlined", "5"},
            {"onboarding-review", "入驻审核", "C", "/onboarding-review", "onboarding-review/index", "system:onboarding:list", "ShopOutlined", "6"},
            {"menu", "菜单管理", "C", "/menu", "menu/index", "system:menu:list", "MenuOutlined", "7"},
        };

        for (String[] def : defaults) {
            String permId = def[0];
            boolean exists = menuMapper.selectCount(new LambdaQueryWrapper<Menu>()
                    .eq(Menu::getTenantId, tenantId)
                    .eq(Menu::getPath, def[3])) > 0;
            if (exists) continue;

            Menu m = new Menu();
            m.setId(IdUtil.fastSimpleUUID());
            m.setTenantId(tenantId);
            m.setName(def[1]);
            m.setMenuType(def[2]);
            m.setPath(def[3]);
            m.setSortOrder(Integer.parseInt(def[7]));
            m.setVisible(true);
            m.setStatus("0");
            if (def[4] != null) m.setComponent(def[4]);
            if (def[5] != null) m.setPerms(def[5]);
            if (def[6] != null) m.setIcon(def[6]);
            menuMapper.insert(m);
            created.add(m);
        }

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
