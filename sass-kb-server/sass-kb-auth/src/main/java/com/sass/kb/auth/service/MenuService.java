package com.sass.kb.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.entity.Menu;
import com.sass.kb.auth.mapper.MenuMapper;
import com.sass.kb.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    public void deleteRecursive(String id) {
        List<Menu> children = menuMapper.selectList(new LambdaQueryWrapper<Menu>()
                .eq(Menu::getParentId, id));
        for (Menu child : children) {
            deleteRecursive(child.getId());
        }
        menuMapper.deleteById(id);
    }
}
