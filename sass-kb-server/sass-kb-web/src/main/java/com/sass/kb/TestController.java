package com.sass.kb;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.common.result.R;
import com.sass.kb.tenant.entity.Tenant;
import com.sass.kb.tenant.mapper.TenantMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final UserMapper userMapper;
    private final TenantMapper tenantMapper;

    private static final String DEFAULT_TENANT = "system-tenant";
    private static final String DEFAULT_PASSWORD = "123456";

    @GetMapping("/hello")
    public R<String> hello() {
        return R.ok("Hello from test controller!");
    }

    @GetMapping("/create-test-user")
    @Transactional
    public R<String> createTestUser() {
        ensureTenant(DEFAULT_TENANT, "系统默认租户");

        // 删除同租户下的旧测试用户
        userMapper.delete(new LambdaQueryWrapper<User>()
                .eq(User::getTenantId, DEFAULT_TENANT)
                .eq(User::getUsername, "test"));

        User user = new User();
        user.setId("test-user-id");
        user.setTenantId(DEFAULT_TENANT);
        user.setUsername("test");
        user.setPasswordHash(BCrypt.hashpw(DEFAULT_PASSWORD));
        user.setRealName("测试用户");
        user.setStatus("active");
        user.setIsSuperAdmin(false);
        userMapper.insert(user);

        return R.ok("测试用户创建成功: test / " + DEFAULT_PASSWORD);
    }

    @GetMapping("/init-seed-data")
    @Transactional
    public R<String> initSeedData() {
        // 1. 租户
        ensureTenant(DEFAULT_TENANT, "系统默认租户");
        ensureTenant("tn-techcorp", "星辰科技有限公司");

        // 2. 系统管理员
        ensureUser("admin-user-id", DEFAULT_TENANT, "admin", "系统管理员",
                "admin@system.com", "13800000000", true);

        // 3. 普通用户
        String[] usernames = {"zhangsan", "lisi", "wangwu", "zhaoliu", "sunqi"};
        String[] realNames = {"张三", "李四", "王五", "赵六", "孙七"};
        for (int i = 0; i < usernames.length; i++) {
            ensureUser("u-" + usernames[i], DEFAULT_TENANT, usernames[i], realNames[i],
                    usernames[i] + "@system.com", "1380000000" + (i + 1), false);
        }

        // 4. 星辰科技管理员
        ensureUser("u-tech-admin", "tn-techcorp", "techadmin", "陈建国",
                "chenjg@techcorp.com", "13900001101", false);

        return R.ok("种子数据初始化成功！所有用户密码都是: " + DEFAULT_PASSWORD);
    }

    private void ensureTenant(String id, String name) {
        if (tenantMapper.selectById(id) == null) {
            Tenant t = new Tenant();
            t.setId(id);
            t.setName(name);
            t.setStatus("active");
            tenantMapper.insert(t);
        }
    }

    private void ensureUser(String id, String tenantId, String username,
                            String realName, String email, String phone, boolean superAdmin) {
        if (userMapper.selectById(id) == null) {
            User user = new User();
            user.setId(id);
            user.setTenantId(tenantId);
            user.setUsername(username);
            user.setPasswordHash(BCrypt.hashpw(DEFAULT_PASSWORD));
            user.setRealName(realName);
            user.setEmail(email);
            user.setPhone(phone);
            user.setStatus("active");
            user.setIsSuperAdmin(superAdmin);
            userMapper.insert(user);
        }
    }
}
