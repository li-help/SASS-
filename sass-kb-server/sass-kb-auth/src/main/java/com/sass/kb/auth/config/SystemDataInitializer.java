package com.sass.kb.auth.config;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.entity.PermissionRule;
import com.sass.kb.auth.entity.Role;
import com.sass.kb.auth.mapper.PermissionRuleMapper;
import com.sass.kb.auth.service.MenuService;
import com.sass.kb.auth.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 系统租户初始化：为通过数据库迁移直插的 system-tenant 补充默认角色、菜单、及管理员角色绑定。
 * 仅补充缺失的数据，已存在则跳过（幂等）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.skip-init-defaults", havingValue = "false", matchIfMissing = true)
public class SystemDataInitializer {

    private static final String SYSTEM_TENANT_ID = "system-tenant";
    private static final String ADMIN_USER_ID = "admin-user-id";

    private final RoleService roleService;
    private final MenuService menuService;
    private final PermissionRuleMapper permissionRuleMapper;

    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        try {
            log.info("[SystemInit] 检查 system-tenant 默认数据…");

            // 1. 初始化默认角色（已有则跳过）
            roleService.initDefaultRoles(SYSTEM_TENANT_ID);
            log.info("[SystemInit] 默认角色检查完成");

            // 2. 初始化默认菜单（已有则跳过）
            menuService.initDefaultMenus(SYSTEM_TENANT_ID);
            log.info("[SystemInit] 默认菜单检查完成");

            // 3. 为 admin 用户分配「管理员」角色（幂等）
            Role adminRole = roleService.findByName(SYSTEM_TENANT_ID, "管理员");
            boolean exists = permissionRuleMapper.exists(new LambdaQueryWrapper<PermissionRule>()
                    .eq(PermissionRule::getTenantId, SYSTEM_TENANT_ID)
                    .eq(PermissionRule::getSubjectType, "user")
                    .eq(PermissionRule::getSubjectId, ADMIN_USER_ID)
                    .eq(PermissionRule::getTargetType, "role")
                    .eq(PermissionRule::getTargetId, adminRole.getId()));
            if (!exists) {
                PermissionRule pr = new PermissionRule();
                pr.setId(IdUtil.fastSimpleUUID());
                pr.setTenantId(SYSTEM_TENANT_ID);
                pr.setSubjectType("user");
                pr.setSubjectId(ADMIN_USER_ID);
                pr.setTargetType("role");
                pr.setTargetId(adminRole.getId());
                pr.setAction("member");
                pr.setEffect("allow");
                permissionRuleMapper.insert(pr);
                log.info("[SystemInit] 已为 admin 分配「管理员」角色");
            } else {
                log.info("[SystemInit] admin 角色绑定已存在，跳过");
            }
        } catch (Exception e) {
            log.warn("[SystemInit] 初始化过程中出现异常（非致命）: {}", e.getMessage());
        }
    }
}
