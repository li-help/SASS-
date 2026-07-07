package com.sass.kb.auth.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.entity.Role;
import com.sass.kb.auth.mapper.RoleMapper;
import com.sass.kb.common.exception.BizException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleMapper roleMapper;

    public List<Role> initDefaultRoles(String tenantId) {
        List<Role> created = new ArrayList<>();

        Long count = roleMapper.selectCount(new LambdaQueryWrapper<Role>()
                .eq(Role::getTenantId, tenantId));
        if (count > 0) {
            return created;
        }

        // 管理员 - 拥有所有权限
        Role admin = new Role();
        admin.setId(IdUtil.fastSimpleUUID());
        admin.setTenantId(tenantId);
        admin.setName("管理员");
        admin.setDescription("拥有所有权限");
        admin.setPermissions(new String[]{"*:*"});
        roleMapper.insert(admin);
        created.add(admin);

        // 普通用户 - 可编辑、下载、读取文件
        Role user = new Role();
        user.setId(IdUtil.fastSimpleUUID());
        user.setTenantId(tenantId);
        user.setName("普通用户");
        user.setDescription("可编辑内容、下载和读取文件");
        user.setPermissions(new String[]{
                "space:read", "doc:read", "doc:write",
                "file:read", "file:write",
        });
        roleMapper.insert(user);
        created.add(user);

        // 访客 - 仅读取和下载
        Role guest = new Role();
        guest.setId(IdUtil.fastSimpleUUID());
        guest.setTenantId(tenantId);
        guest.setName("访客");
        guest.setDescription("仅可读取和下载文件");
        guest.setPermissions(new String[]{
                "space:read", "doc:read", "file:read",
        });
        roleMapper.insert(guest);
        created.add(guest);

        return created;
    }

    public Role findByName(String tenantId, String name) {
        Role role = roleMapper.selectOne(new LambdaQueryWrapper<Role>()
                .eq(Role::getTenantId, tenantId)
                .eq(Role::getName, name));
        if (role == null) {
            throw new BizException(404, "角色不存在: " + name);
        }
        return role;
    }
}
