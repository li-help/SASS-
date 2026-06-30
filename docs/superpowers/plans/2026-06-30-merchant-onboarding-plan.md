# 商家入驻功能 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SASS 知识平台添加外部商家自助入驻 + 管理员审核流程

**Architecture:** 新建 `sass-kb-onboarding` Maven 模块，包含 `MerchantApplication` 实体、Service、Controller；前端新增 3 个页面（入驻申请、审核管理、进度查询）

**Tech Stack:** Java 17 / Spring Boot 3.2 / MyBatis-Plus 3.5.5 / PostgreSQL / Flyway / React 19 / TypeScript 6 / Ant Design 6 / TanStack React Query 5

---

## 文件结构

```
sass-kb-server/
├── sass-kb-onboarding/                          # 新建 Maven 模块
│   ├── pom.xml
│   └── src/main/java/com/sass/kb/onboarding/
│       ├── entity/MerchantApplication.java       # MyBatis-Plus Entity
│       ├── mapper/MerchantApplicationMapper.java # MyBatis-Plus BaseMapper
│       ├── dto/
│       │   ├── ApplyRequest.java                 # 申请请求 DTO
│       │   ├── ApplicationVO.java                # 申请记录 VO
│       │   └── RejectRequest.java                # 驳回请求 DTO
│       ├── service/
│       │   └── MerchantApplicationService.java   # 业务逻辑
│       └── controller/
│           └── OnboardingController.java         # REST 控制器
├── sass-kb-web/
│   ├── pom.xml                                   # 添加 sass-kb-onboarding 依赖
│   └── src/main/resources/db/migration/
│       └── V7__merchant_onboarding.sql           # Flyway 迁移
├── sass-kb-tenant/src/main/java/.../config/
│   └── MybatisPlusConfig.java                    # 忽略 merchant_application 表
└── sass-kb-web/src/main/java/.../config/
    └── WebMvcConfig.java                         # 放行 /api/onboarding/apply, /api/onboarding/status

sass-kb-admin/src/
├── services/onboardingApi.ts                     # 入驻 API 封装
├── types/onboarding.ts                           # 入驻类型定义
├── pages/
│   ├── onboarding/                               # 入驻申请页
│   │   └── index.tsx
│   ├── onboarding-review/                        # 入驻审核页
│   │   └── index.tsx
│   └── onboarding-status/                        # 进度查询页
│       └── index.tsx
├── routes/index.tsx                              # 新增 3 条路由
└── layouts/MainLayout.tsx                        # 侧边栏新增「入驻审核」
```

---

### Task 1: 创建 Maven 模块 `sass-kb-onboarding`

**Files:**
- Create: `sass-kb-server/sass-kb-onboarding/pom.xml`
- Create: `sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/package-info.java`

- [ ] **Step 1: 创建模块 pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.sass.kb</groupId>
        <artifactId>sass-kb-server</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>sass-kb-onboarding</artifactId>
    <packaging>jar</packaging>

    <dependencies>
        <dependency>
            <groupId>com.sass.kb</groupId>
            <artifactId>sass-kb-common</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>com.sass.kb</groupId>
            <artifactId>sass-kb-tenant</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>com.sass.kb</groupId>
            <artifactId>sass-kb-auth</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>com.sass.kb</groupId>
            <artifactId>sass-kb-notification</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 在父 pom.xml 中注册模块**

Edit `sass-kb-server/pom.xml`，在 `<modules>` 中添加 `<module>sass-kb-onboarding</module>`：

```xml
<modules>
    <module>sass-kb-common</module>
    <module>sass-kb-tenant</module>
    <module>sass-kb-auth</module>
    <module>sass-kb-doc</module>
    <module>sass-kb-file</module>
    <module>sass-kb-search</module>
    <module>sass-kb-collaboration</module>
    <module>sass-kb-notification</module>
    <module>sass-kb-onboarding</module>
    <module>sass-kb-web</module>
</modules>
```

- [ ] **Step 3: 在 sass-kb-web/pom.xml 中添加依赖**

在 `sass-kb-web/pom.xml` 的 `<dependencies>` 中添加：

```xml
<dependency>
    <groupId>com.sass.kb</groupId>
    <artifactId>sass-kb-onboarding</artifactId>
    <version>${project.version}</version>
</dependency>
```

- [ ] **Step 4: 编译验证**

```bash
cd sass-kb-server && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add sass-kb-server/sass-kb-onboarding/ sass-kb-server/pom.xml sass-kb-server/sass-kb-web/pom.xml
git commit -m "feat(onboarding): 创建 sass-kb-onboarding Maven 模块"
```

---

### Task 2: 数据库迁移 — Flyway V7

**Files:**
- Create: `sass-kb-server/sass-kb-web/src/main/resources/db/migration/V7__merchant_onboarding.sql`

- [ ] **Step 1: 编写迁移 SQL**

```sql
-- V7: 商家入驻申请表
CREATE TABLE merchant_application (
    id              VARCHAR(32)   PRIMARY KEY,
    -- 企业信息
    company_name    VARCHAR(200)  NOT NULL,
    credit_code     VARCHAR(50)   NOT NULL,
    license_url     VARCHAR(500),
    legal_person    VARCHAR(100),
    company_address VARCHAR(300),
    business_scope  VARCHAR(500),
    contact_phone   VARCHAR(20),
    contact_email   VARCHAR(100),
    -- 申请人信息（初始管理员）
    username        VARCHAR(100)  NOT NULL,
    password_hash   VARCHAR(200)  NOT NULL,
    real_name       VARCHAR(100)  NOT NULL,
    email           VARCHAR(100),
    phone           VARCHAR(20),
    -- 审核信息
    status          VARCHAR(20)   NOT NULL DEFAULT 'pending',
    review_comment  VARCHAR(500),
    reviewed_by     VARCHAR(32),
    reviewed_at     TIMESTAMP,
    -- 通过后关联
    tenant_id       VARCHAR(32),
    user_id         VARCHAR(32),
    -- 时间戳
    created_at      TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ma_credit_code ON merchant_application(credit_code);
CREATE INDEX idx_ma_status ON merchant_application(status);

-- tenant 表添加来源字段
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';
```

- [ ] **Step 2: 本地验证 SQL 语法**

```bash
cd sass-kb-server && mvn flyway:info -pl sass-kb-web -q 2>&1 | tail -5
```

Expected: 列出所有迁移，包含 V7 作为 pending。

- [ ] **Step 3: Commit**

```bash
git add sass-kb-server/sass-kb-web/src/main/resources/db/migration/V7__merchant_onboarding.sql
git commit -m "feat(onboarding): Flyway V7 迁移 — merchant_application 表 + tenant.source 列"
```

---

### Task 3: Entity + Mapper

**Files:**
- Create: `sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/entity/MerchantApplication.java`
- Create: `sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/mapper/MerchantApplicationMapper.java`

- [ ] **Step 1: 创建 MerchantApplication Entity**

```java
package com.sass.kb.onboarding.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("merchant_application")
public class MerchantApplication {
    @TableId
    private String id;

    // 企业信息
    private String companyName;
    private String creditCode;
    private String licenseUrl;
    private String legalPerson;
    private String companyAddress;
    private String businessScope;
    private String contactPhone;
    private String contactEmail;

    // 申请人信息
    private String username;
    private String passwordHash;
    private String realName;
    private String email;
    private String phone;

    // 审核信息
    private String status;
    private String reviewComment;
    private String reviewedBy;
    private LocalDateTime reviewedAt;

    // 通过后关联
    private String tenantId;
    private String userId;

    // 时间戳
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 2: 创建 MerchantApplicationMapper**

```java
package com.sass.kb.onboarding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sass.kb.onboarding.entity.MerchantApplication;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MerchantApplicationMapper extends BaseMapper<MerchantApplication> {
}
```

- [ ] **Step 3: Commit**

```bash
git add sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/entity/ sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/mapper/
git commit -m "feat(onboarding): MerchantApplication Entity + Mapper"
```

---

### Task 4: DTOs

**Files:**
- Create: `sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/dto/ApplyRequest.java`
- Create: `sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/dto/RejectRequest.java`
- Create: `sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/dto/ApplicationVO.java`

- [ ] **Step 1: 创建 ApplyRequest**

```java
package com.sass.kb.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApplyRequest {

    // ── 企业信息 ──
    @NotBlank(message = "公司全称不能为空")
    @Size(max = 200)
    private String companyName;

    @NotBlank(message = "统一社会信用代码不能为空")
    @Size(min = 18, max = 18, message = "统一社会信用代码为 18 位")
    private String creditCode;

    private String licenseUrl;
    private String legalPerson;
    private String companyAddress;
    private String businessScope;
    private String contactPhone;
    private String contactEmail;

    // ── 管理员账号 ──
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100)
    private String password;

    @NotBlank(message = "真实姓名不能为空")
    @Size(max = 100)
    private String realName;

    private String email;
    private String phone;
}
```

- [ ] **Step 2: 创建 RejectRequest**

```java
package com.sass.kb.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectRequest {
    @NotBlank(message = "驳回原因不能为空")
    private String reason;
}
```

- [ ] **Step 3: 创建 ApplicationVO**

```java
package com.sass.kb.onboarding.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ApplicationVO {
    private String id;
    private String companyName;
    private String creditCode;
    private String licenseUrl;
    private String legalPerson;
    private String companyAddress;
    private String businessScope;
    private String contactPhone;
    private String contactEmail;
    private String username;
    private String realName;
    private String email;
    private String phone;
    private String status;
    private String reviewComment;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private String tenantId;
    private String userId;
    private LocalDateTime createdAt;
}
```

- [ ] **Step 4: Commit**

```bash
git add sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/dto/
git commit -m "feat(onboarding): ApplyRequest, RejectRequest, ApplicationVO DTOs"
```

---

### Task 5: MerchantApplicationService

**Files:**
- Create: `sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/service/MerchantApplicationService.java`

- [ ] **Step 1: 编写完整 Service**

```java
package com.sass.kb.onboarding.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.auth.entity.Role;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.RoleMapper;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.notification.entity.Notification;
import com.sass.kb.notification.service.NotificationService;
import com.sass.kb.onboarding.dto.ApplyRequest;
import com.sass.kb.onboarding.dto.ApplicationVO;
import com.sass.kb.onboarding.dto.RejectRequest;
import com.sass.kb.onboarding.entity.MerchantApplication;
import com.sass.kb.onboarding.mapper.MerchantApplicationMapper;
import com.sass.kb.tenant.entity.Tenant;
import com.sass.kb.tenant.mapper.TenantMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantApplicationService {

    private final MerchantApplicationMapper applicationMapper;
    private final TenantMapper tenantMapper;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final NotificationService notificationService;

    // ── 公共 API ──

    public String apply(ApplyRequest req) {
        // 1. 校验信用代码唯一性（rejected 状态允许重新申请，但这里先简化：resolved/rejected 都不允许重复）
        boolean creditExists = applicationMapper.exists(
                new LambdaQueryWrapper<MerchantApplication>()
                        .eq(MerchantApplication::getCreditCode, req.getCreditCode())
                        .ne(MerchantApplication::getStatus, "rejected"));
        if (creditExists) {
            throw new BizException("该统一社会信用代码已提交过申请");
        }

        // 2. 校验用户名不重复（跨 user 表和 application 表）
        boolean usernameExistsInUser = userMapper.exists(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, req.getUsername()));
        if (usernameExistsInUser) {
            throw new BizException("该用户名已存在");
        }
        boolean usernameExistsInApp = applicationMapper.exists(
                new LambdaQueryWrapper<MerchantApplication>()
                        .eq(MerchantApplication::getUsername, req.getUsername())
                        .eq(MerchantApplication::getStatus, "pending"));
        if (usernameExistsInApp) {
            throw new BizException("该用户名已有待审核的申请");
        }

        // 3. 保存申请
        MerchantApplication app = new MerchantApplication();
        app.setId(IdUtil.fastSimpleUUID());
        app.setCompanyName(req.getCompanyName());
        app.setCreditCode(req.getCreditCode());
        app.setLicenseUrl(req.getLicenseUrl());
        app.setLegalPerson(req.getLegalPerson());
        app.setCompanyAddress(req.getCompanyAddress());
        app.setBusinessScope(req.getBusinessScope());
        app.setContactPhone(req.getContactPhone());
        app.setContactEmail(req.getContactEmail());
        app.setUsername(req.getUsername());
        app.setPasswordHash(BCrypt.hashpw(req.getPassword(), BCrypt.gensalt()));
        app.setRealName(req.getRealName());
        app.setEmail(req.getEmail());
        app.setPhone(req.getPhone());
        app.setStatus("pending");
        app.setCreatedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());

        applicationMapper.insert(app);
        log.info("商家入驻申请已提交: id={}, company={}, username={}", app.getId(), app.getCompanyName(), app.getUsername());
        return app.getId();
    }

    // ── 管理员 API ──

    public PageResult<ApplicationVO> listApplications(int page, int size, String status, String keyword) {
        LambdaQueryWrapper<MerchantApplication> wrapper = new LambdaQueryWrapper<MerchantApplication>()
                .eq(status != null && !status.isBlank(), MerchantApplication::getStatus, status)
                .and(keyword != null && !keyword.isBlank(), w -> w
                        .like(MerchantApplication::getCompanyName, keyword)
                        .or()
                        .like(MerchantApplication::getUsername, keyword))
                .orderByDesc(MerchantApplication::getCreatedAt);

        Page<MerchantApplication> p = applicationMapper.selectPage(
                new Page<>(page, size), wrapper);

        List<ApplicationVO> vos = p.getRecords().stream().map(this::toVO).toList();
        return new PageResult<>(vos, p.getTotal(), page, size);
    }

    public ApplicationVO getApplication(String id) {
        MerchantApplication app = applicationMapper.selectById(id);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        return toVO(app);
    }

    @Transactional
    public ApplicationVO approve(String id, String reviewerId) {
        MerchantApplication app = applicationMapper.selectById(id);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        if (!"pending".equals(app.getStatus())) {
            throw new BizException("该申请不是待审核状态");
        }

        // 1. 创建租户
        Tenant tenant = new Tenant();
        tenant.setId(IdUtil.fastSimpleUUID());
        tenant.setName(app.getCompanyName());
        tenant.setContactName(app.getRealName());
        tenant.setContactPhone(app.getContactPhone());
        tenant.setStatus("active");
        tenantMapper.insert(tenant);

        // 2. 创建超级管理员用户
        User user = new User();
        user.setId(IdUtil.fastSimpleUUID());
        user.setTenantId(tenant.getId());
        user.setUsername(app.getUsername());
        user.setPasswordHash(app.getPasswordHash());
        user.setRealName(app.getRealName());
        user.setEmail(app.getEmail());
        user.setPhone(app.getPhone());
        user.setStatus("active");
        user.setIsSuperAdmin(true);
        userMapper.insert(user);

        // 3. 初始化默认角色（管理员、编辑者、阅读者）
        String adminRoleId = IdUtil.fastSimpleUUID();
        Role adminRole = new Role();
        adminRole.setId(adminRoleId);
        adminRole.setTenantId(tenant.getId());
        adminRole.setName("管理员");
        adminRole.setDescription("拥有所有权限");
        adminRole.setPermissions(new String[]{"*:*"});
        roleMapper.insert(adminRole);

        String editorId = IdUtil.fastSimpleUUID();
        Role editor = new Role();
        editor.setId(editorId);
        editor.setTenantId(tenant.getId());
        editor.setName("编辑者");
        editor.setDescription("可查看内容并编辑文档");
        editor.setPermissions(new String[]{"space:read", "doc:read", "doc:write", "file:read", "file:write"});
        roleMapper.insert(editor);

        Role viewer = new Role();
        viewer.setId(IdUtil.fastSimpleUUID());
        viewer.setTenantId(tenant.getId());
        viewer.setName("阅读者");
        viewer.setDescription("仅可查看内容");
        viewer.setParentId(editorId);
        viewer.setPermissions(new String[]{"space:read", "doc:read", "file:read"});
        roleMapper.insert(viewer);

        // 4. 更新申请状态
        app.setStatus("approved");
        app.setTenantId(tenant.getId());
        app.setUserId(user.getId());
        app.setReviewedBy(reviewerId);
        app.setReviewedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());
        applicationMapper.updateById(app);

        // 5. 发送通知
        try {
            Notification notif = new Notification();
            notif.setId(IdUtil.fastSimpleUUID());
            notif.setUserId(user.getId());
            notif.setTitle("商家入驻审核通过");
            notif.setContent("恭喜！您的企业「" + app.getCompanyName() + "」入驻申请已通过审核，现在可以登录使用了。");
            notif.setType("onboarding");
            notif.setIsRead(false);
            notif.setCreatedAt(LocalDateTime.now());
            notificationService.create(notif);
        } catch (Exception e) {
            log.warn("发送入驻通过通知失败: {}", e.getMessage());
        }

        log.info("商家入驻审核通过: applicationId={}, tenantId={}, userId={}", id, tenant.getId(), user.getId());
        return toVO(app);
    }

    @Transactional
    public ApplicationVO reject(String id, String reviewerId, RejectRequest req) {
        MerchantApplication app = applicationMapper.selectById(id);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        if (!"pending".equals(app.getStatus())) {
            throw new BizException("该申请不是待审核状态");
        }

        app.setStatus("rejected");
        app.setReviewComment(req.getReason());
        app.setReviewedBy(reviewerId);
        app.setReviewedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());
        applicationMapper.updateById(app);

        log.info("商家入驻审核驳回: applicationId={}, reason={}", id, req.getReason());
        return toVO(app);
    }

    // ── 公开 API ──

    public ApplicationVO getStatus(String applicationId) {
        MerchantApplication app = applicationMapper.selectById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        ApplicationVO vo = new ApplicationVO();
        vo.setId(app.getId());
        vo.setCompanyName(app.getCompanyName());
        vo.setStatus(app.getStatus());
        vo.setReviewComment(app.getReviewComment());
        vo.setCreatedAt(app.getCreatedAt());
        return vo;
    }

    // ── 辅助方法 ──

    private ApplicationVO toVO(MerchantApplication app) {
        ApplicationVO vo = new ApplicationVO();
        vo.setId(app.getId());
        vo.setCompanyName(app.getCompanyName());
        vo.setCreditCode(app.getCreditCode());
        vo.setLicenseUrl(app.getLicenseUrl());
        vo.setLegalPerson(app.getLegalPerson());
        vo.setCompanyAddress(app.getCompanyAddress());
        vo.setBusinessScope(app.getBusinessScope());
        vo.setContactPhone(app.getContactPhone());
        vo.setContactEmail(app.getContactEmail());
        vo.setUsername(app.getUsername());
        vo.setRealName(app.getRealName());
        vo.setEmail(app.getEmail());
        vo.setPhone(app.getPhone());
        vo.setStatus(app.getStatus());
        vo.setReviewComment(app.getReviewComment());
        vo.setReviewedBy(app.getReviewedBy());
        vo.setReviewedAt(app.getReviewedAt());
        vo.setTenantId(app.getTenantId());
        vo.setUserId(app.getUserId());
        vo.setCreatedAt(app.getCreatedAt());
        return vo;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/service/
git commit -m "feat(onboarding): MerchantApplicationService — 申请/审核/查询完整业务逻辑"
```

---

### Task 6: OnboardingController

**Files:**
- Create: `sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/controller/OnboardingController.java`

- [ ] **Step 1: 编写 Controller**

```java
package com.sass.kb.onboarding.controller;

import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.onboarding.dto.ApplyRequest;
import com.sass.kb.onboarding.dto.ApplicationVO;
import com.sass.kb.onboarding.dto.RejectRequest;
import com.sass.kb.onboarding.service.MerchantApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final MerchantApplicationService service;

    // ── 公开接口 ──

    @PostMapping("/apply")
    public R<String> apply(@Valid @RequestBody ApplyRequest req) {
        String applicationId = service.apply(req);
        return R.ok(applicationId);
    }

    @GetMapping("/status")
    public R<ApplicationVO> status(@RequestParam String applicationId) {
        return R.ok(service.getStatus(applicationId));
    }

    // ── 管理员接口 ──

    @GetMapping("/applications")
    public R<PageResult<ApplicationVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            HttpServletRequest request) {
        checkSuperAdmin(request);
        return R.ok(service.listApplications(page, size, status, keyword));
    }

    @GetMapping("/applications/{id}")
    public R<ApplicationVO> detail(@PathVariable String id, HttpServletRequest request) {
        checkSuperAdmin(request);
        return R.ok(service.getApplication(id));
    }

    @PostMapping("/applications/{id}/approve")
    public R<ApplicationVO> approve(@PathVariable String id, HttpServletRequest request) {
        checkSuperAdmin(request);
        String reviewerId = (String) request.getAttribute("userId");
        return R.ok(service.approve(id, reviewerId));
    }

    @PostMapping("/applications/{id}/reject")
    public R<ApplicationVO> reject(@PathVariable String id,
                                    @Valid @RequestBody RejectRequest rejectReq,
                                    HttpServletRequest request) {
        checkSuperAdmin(request);
        String reviewerId = (String) request.getAttribute("userId");
        return R.ok(service.reject(id, reviewerId, rejectReq));
    }

    private void checkSuperAdmin(HttpServletRequest request) {
        Boolean isSuperAdmin = (Boolean) request.getAttribute("isSuperAdmin");
        if (!Boolean.TRUE.equals(isSuperAdmin)) {
            throw new com.sass.kb.common.exception.BizException(403, "仅平台超级管理员可操作");
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/controller/
git commit -m "feat(onboarding): OnboardingController — 6 个 REST 接口"
```

---

### Task 7: 配置修改 — MyBatisPlus + WebMvc

**Files:**
- Modify: `sass-kb-server/sass-kb-tenant/src/main/java/com/sass/kb/tenant/config/MybatisPlusConfig.java`
- Modify: `sass-kb-server/sass-kb-web/src/main/java/com/sass/kb/config/WebMvcConfig.java`

- [ ] **Step 1: MybatisPlusConfig — 忽略 merchant_application 表**

在 `MybatisPlusConfig.java` 的 `ignoreTable` 方法中，将 `merchant_application` 加入忽略集合：

```java
return Set.of("tenant", "user", "merchant_application").contains(normalized);
```

原代码：
```java
return Set.of("tenant", "user").contains(normalized);
```

- [ ] **Step 2: WebMvcConfig — 放行入驻公开接口**

在 `WebMvcConfig.java` 的 `addInterceptors` 方法中，`authInterceptor` 的 `excludePathPatterns` 添加：

```java
"/api/onboarding/apply", "/api/onboarding/status"
```

原 excludePathPatterns 变为：
```java
.excludePathPatterns("/api/auth/login", "/api/auth/refresh", "/api/auth/register",
        "/api/onboarding/apply", "/api/onboarding/status",
        "/v3/api-docs/**", "/doc.html", "/swagger-ui/**",
        "/actuator/**", "/api/test/**", "/api/file/*/download-file")
```

- [ ] **Step 3: 编译验证**

```bash
cd sass-kb-server && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add sass-kb-server/sass-kb-tenant/src/main/java/com/sass/kb/tenant/config/MybatisPlusConfig.java sass-kb-server/sass-kb-web/src/main/java/com/sass/kb/config/WebMvcConfig.java
git commit -m "feat(onboarding): MyBatisPlus 忽略 merchant_application + WebMvc 放行入驻接口"
```

---

### Task 8: 前端 — API 服务和类型定义

**Files:**
- Create: `sass-kb-admin/src/types/onboarding.ts`
- Create: `sass-kb-admin/src/services/onboardingApi.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
// sass-kb-admin/src/types/onboarding.ts

export interface ApplyRequest {
  companyName: string;
  creditCode: string;
  licenseUrl?: string;
  legalPerson?: string;
  companyAddress?: string;
  businessScope?: string;
  contactPhone?: string;
  contactEmail?: string;
  username: string;
  password: string;
  realName: string;
  email?: string;
  phone?: string;
}

export interface ApplicationVO {
  id: string;
  companyName: string;
  creditCode: string;
  licenseUrl?: string;
  legalPerson?: string;
  companyAddress?: string;
  businessScope?: string;
  contactPhone?: string;
  contactEmail?: string;
  username: string;
  realName: string;
  email?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  tenantId?: string;
  userId?: string;
  createdAt: string;
}

export interface RejectRequest {
  reason: string;
}
```

- [ ] **Step 2: 创建 API 服务**

```typescript
// sass-kb-admin/src/services/onboardingApi.ts

import api from './api';
import type { ApiResponse, PageResult } from '@/types/common';
import type { ApplyRequest, ApplicationVO, RejectRequest } from '@/types/onboarding';

export const onboardingApi = {
  /** 提交入驻申请（公开） */
  apply: (data: ApplyRequest) =>
    api.post<any, ApiResponse<string>>('/onboarding/apply', data),

  /** 查询申请进度（公开） */
  status: (applicationId: string) =>
    api.get<any, ApiResponse<ApplicationVO>>('/onboarding/status', {
      params: { applicationId },
    }),

  /** 管理员：申请列表 */
  list: (params?: { page?: number; size?: number; status?: string; keyword?: string }) =>
    api.get<any, ApiResponse<PageResult<ApplicationVO>>>('/onboarding/applications', { params }),

  /** 管理员：申请详情 */
  detail: (id: string) =>
    api.get<any, ApiResponse<ApplicationVO>>(`/onboarding/applications/${id}`),

  /** 管理员：审核通过 */
  approve: (id: string) =>
    api.post<any, ApiResponse<ApplicationVO>>(`/onboarding/applications/${id}/approve`),

  /** 管理员：审核驳回 */
  reject: (id: string, data: RejectRequest) =>
    api.post<any, ApiResponse<ApplicationVO>>(`/onboarding/applications/${id}/reject`, data),
};
```

- [ ] **Step 3: Commit**

```bash
git add sass-kb-admin/src/types/onboarding.ts sass-kb-admin/src/services/onboardingApi.ts
git commit -m "feat(onboarding): 前端 API 服务 + 类型定义"
```

---

### Task 9: 前端 — 入驻申请页

**Files:**
- Create: `sass-kb-admin/src/pages/onboarding/index.tsx`

- [ ] **Step 1: 编写入驻申请页（Steps 分步表单）**

```tsx
import { useState } from 'react';
import { Button, Form, Input, Steps, Upload, message, Result, Typography, Space } from 'antd';
import {
  UploadOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { onboardingApi } from '@/services/onboardingApi';
import { fileApi } from '@/services/fileService';
import type { UploadFile } from 'antd';
import type { ApplyRequest } from '@/types/onboarding';

const { TextArea } = Input;
const { Title, Text } = Typography;

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const applyMut = useMutation({
    mutationFn: (data: ApplyRequest) => onboardingApi.apply(data),
    onSuccess: (res) => {
      setApplicationId(res.data);
      setCurrent(2);
    },
    onError: (err: Error) => message.error(err.message || '提交失败'),
  });

  const handleNext = async () => {
    try {
      await form.validateFields();
      if (current === 1) {
        const values = form.getFieldsValue();
        applyMut.mutate(values);
      } else {
        setCurrent(1);
      }
    } catch {
      // validation errors shown by Form
    }
  };

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fileApi.upload(formData);
    return (res.data as any)?.url || '';
  };

  const steps = [
    { title: '企业信息' },
    { title: '管理员账号' },
    { title: '提交成功' },
  ];

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 16px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
        🏢 商家入驻
      </Title>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
        填写企业和管理员信息，提交后等待审核
      </Text>

      <Steps current={current} items={steps} style={{ marginBottom: 40 }} />

      {current === 0 && (
        <Form form={form} layout="vertical" initialValues={{}}>
          <Form.Item name="companyName" label="公司全称" rules={[{ required: true, message: '请输入公司全称' }]}>
            <Input placeholder="营业执照上的公司全称" />
          </Form.Item>
          <Form.Item
            name="creditCode"
            label="统一社会信用代码"
            rules={[
              { required: true, message: '请输入统一社会信用代码' },
              { len: 18, message: '统一社会信用代码为 18 位' },
            ]}
          >
            <Input placeholder="18 位统一社会信用代码" maxLength={18} />
          </Form.Item>
          <Form.Item name="licenseUrl" label="营业执照">
            <Upload
              maxCount={1}
              beforeUpload={async (file) => {
                const url = await handleUpload(file);
                form.setFieldValue('licenseUrl', url);
                return false; // prevent default upload
              }}
              onRemove={() => form.setFieldValue('licenseUrl', undefined)}
            >
              <Button icon={<UploadOutlined />}>上传营业执照</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="legalPerson" label="法人姓名">
            <Input placeholder="法人代表姓名" />
          </Form.Item>
          <Form.Item name="companyAddress" label="公司地址">
            <Input placeholder="公司注册地址" />
          </Form.Item>
          <Form.Item name="businessScope" label="经营范围">
            <TextArea rows={3} placeholder="营业执照上的经营范围" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input placeholder="企业联系电话" />
          </Form.Item>
          <Form.Item name="contactEmail" label="联系邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="企业联系邮箱" />
          </Form.Item>
        </Form>
      )}

      {current === 1 && (
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="登录账号" rules={[
            { required: true, message: '请输入登录账号' },
            { min: 3, max: 50, message: '账号长度 3-50 位' },
          ]}>
            <Input placeholder="用于登录平台的账号" />
          </Form.Item>
          <Form.Item name="password" label="登录密码" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, max: 100, message: '密码长度 6-100 位' },
          ]}>
            <Input.Password placeholder="至少 6 位密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="再次输入密码" />
          </Form.Item>
          <Form.Item name="realName" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input placeholder="您的真实姓名" />
          </Form.Item>
          <Form.Item name="email" label="个人邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="联系用邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="个人手机">
            <Input placeholder="联系用手机号" />
          </Form.Item>
        </Form>
      )}

      {current === 2 && (
        <Result
          status="success"
          title="申请已提交"
          subTitle="我们会在 1-3 个工作日内完成审核，审核结果将通知到您的邮箱。"
          extra={[
            <Button type="primary" key="status" onClick={() => navigate(`/onboarding-status?applicationId=${applicationId}`)}>
              查看进度
            </Button>,
            <Button key="home" onClick={() => navigate('/login')}>
              返回登录
            </Button>,
          ]}
        />
      )}

      {current < 2 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button
            disabled={current === 0}
            onClick={() => setCurrent(current - 1)}
            icon={<ArrowLeftOutlined />}
          >
            上一步
          </Button>
          <Button type="primary" onClick={handleNext} loading={applyMut.isPending} icon={<ArrowRightOutlined />}>
            {current === 1 ? '提交审核' : '下一步'}
          </Button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Text type="secondary">已有账号？</Text>{' '}
        <Link to="/login">去登录</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sass-kb-admin/src/pages/onboarding/
git commit -m "feat(onboarding): 入驻申请页 — Steps 分步表单"
```

---

### Task 10: 前端 — 入驻审核页

**Files:**
- Create: `sass-kb-admin/src/pages/onboarding-review/index.tsx`

- [ ] **Step 1: 编写审核页（Table + Drawer + 审批操作）**

```tsx
import { useState } from 'react';
import {
  Table, Button, Tag, Drawer, Descriptions, Modal, Input, message, Space, Tabs, Image,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApi } from '@/services/onboardingApi';
import type { ApplicationVO } from '@/types/onboarding';

const { TextArea } = Input;

export default function OnboardingReviewPage() {
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<string>('pending');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ApplicationVO | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-applications', page, statusTab],
    queryFn: () => onboardingApi.list({
      page, size: 20,
      status: statusTab === 'all' ? undefined : statusTab,
    }),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => onboardingApi.approve(id),
    onSuccess: () => {
      message.success('审核通过，租户和账号已自动创建');
      setDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['onboarding-applications'] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      onboardingApi.reject(id, { reason }),
    onSuccess: () => {
      message.success('已驳回');
      setRejectModalOpen(false);
      setRejectReason('');
      setDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['onboarding-applications'] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  const handleView = (record: ApplicationVO) => {
    setSelected(record);
    setDrawerOpen(true);
  };

  const statusColor: Record<string, string> = {
    pending: 'processing',
    approved: 'success',
    rejected: 'error',
  };
  const statusLabel: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: `待审核` },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已驳回' },
  ];

  const columns = [
    { title: '公司名称', dataIndex: 'companyName', key: 'companyName', ellipsis: true },
    { title: '信用代码', dataIndex: 'creditCode', key: 'creditCode', width: 200 },
    { title: '申请人', dataIndex: 'realName', key: 'realName', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>,
    },
    {
      title: '提交时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: any, record: ApplicationVO) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>入驻审核</h2>

      <Tabs activeKey={statusTab} onChange={(k) => { setStatusTab(k); setPage(1); }} items={tabItems} />

      <Table
        columns={columns}
        dataSource={data?.data?.records || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.data?.total || 0,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条申请`,
        }}
        locale={{ emptyText: '暂无入驻申请' }}
      />

      <Drawer
        title="申请详情"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={580}
        extra={
          selected?.status === 'pending' && (
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={approveMut.isPending}
                onClick={() => approveMut.mutate(selected!.id)}
              >
                通过
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectModalOpen(true)}
              >
                驳回
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <>
            <Descriptions title="📋 企业信息" column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="公司全称" span={2}>{selected.companyName}</Descriptions.Item>
              <Descriptions.Item label="信用代码" span={2}>{selected.creditCode}</Descriptions.Item>
              <Descriptions.Item label="法人">{selected.legalPerson || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selected.contactPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="公司地址" span={2}>{selected.companyAddress || '-'}</Descriptions.Item>
              <Descriptions.Item label="经营范围" span={2}>{selected.businessScope || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系邮箱">{selected.contactEmail || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColor[selected.status]}>{statusLabel[selected.status]}</Tag>
              </Descriptions.Item>
              {selected.licenseUrl && (
                <Descriptions.Item label="营业执照" span={2}>
                  <Image src={selected.licenseUrl} width={200} alt="营业执照" />
                </Descriptions.Item>
              )}
            </Descriptions>

            <Descriptions title="👤 管理员账号" column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="登录账号">{selected.username}</Descriptions.Item>
              <Descriptions.Item label="真实姓名">{selected.realName}</Descriptions.Item>
              <Descriptions.Item label="个人邮箱">{selected.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="个人手机">{selected.phone || '-'}</Descriptions.Item>
            </Descriptions>

            {selected.reviewComment && (
              <Descriptions title="📝 审核意见" column={1} bordered size="small">
                <Descriptions.Item label="驳回原因">{selected.reviewComment}</Descriptions.Item>
              </Descriptions>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title="驳回申请"
        open={rejectModalOpen}
        onOk={() => {
          if (!rejectReason.trim()) { message.warning('请输入驳回原因'); return; }
          rejectMut.mutate({ id: selected!.id, reason: rejectReason });
        }}
        onCancel={() => { setRejectModalOpen(false); setRejectReason(''); }}
        confirmLoading={rejectMut.isPending}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <TextArea
          rows={4}
          placeholder="请输入驳回原因..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sass-kb-admin/src/pages/onboarding-review/
git commit -m "feat(onboarding): 入驻审核页 — Table + Drawer + 审批"
```

---

### Task 11: 前端 — 进度查询页

**Files:**
- Create: `sass-kb-admin/src/pages/onboarding-status/index.tsx`

- [ ] **Step 1: 编写进度查询页**

```tsx
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Result, Spin, Button, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { onboardingApi } from '@/services/onboardingApi';

const { Text } = Typography;

export default function OnboardingStatusPage() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId') || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['onboarding-status', applicationId],
    queryFn: () => onboardingApi.status(applicationId),
    enabled: !!applicationId,
    refetchInterval: 15_000, // 每 15 秒自动刷新
  });

  if (!applicationId) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
        <Result
          status="warning"
          title="缺少申请编号"
          subTitle="请从提交成功页面跳转，或输入申请编号查询"
          extra={<Link to="/login"><Button type="primary">返回登录</Button></Link>}
        />
      </div>
    );
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" tip="查询中..." /></div>;
  }

  if (error || !data?.data) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
        <Result status="error" title="查询失败" subTitle="申请不存在或编号有误" />
      </div>
    );
  }

  const app = data.data;

  const statusConfig: Record<string, { status: 'success' | 'info' | 'error'; title: string; subTitle: string; extra?: React.ReactNode }> = {
    pending: {
      status: 'info',
      title: '审核中',
      subTitle: `您的入驻申请正在审核中，请耐心等待。企业名称：${app.companyName}`,
    },
    approved: {
      status: 'success',
      title: '审核通过',
      subTitle: `恭喜！您的企业「${app.companyName}」已通过审核，现在可以登录使用了。`,
      extra: <Link to="/login"><Button type="primary">去登录</Button></Link>,
    },
    rejected: {
      status: 'error',
      title: '审核驳回',
      subTitle: app.reviewComment || '您的入驻申请未通过审核',
    },
  };

  const config = statusConfig[app.status] || statusConfig.pending;

  return (
    <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
      <Result
        status={config.status}
        title={config.title}
        subTitle={
          <>
            <Text>{config.subTitle}</Text>
            <br />
            <Tag style={{ marginTop: 12 }}>
              {app.status === 'pending' ? '待审核' : app.status === 'approved' ? '已通过' : '已驳回'}
            </Tag>
          </>
        }
        extra={config.extra}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sass-kb-admin/src/pages/onboarding-status/
git commit -m "feat(onboarding): 申请进度查询页"
```

---

### Task 12: 前端 — 路由和菜单集成

**Files:**
- Modify: `sass-kb-admin/src/routes/index.tsx`
- Modify: `sass-kb-admin/src/layouts/MainLayout.tsx`

- [ ] **Step 1: 添加路由**

在 `sass-kb-admin/src/routes/index.tsx` 中：

添加 lazy import（与其他 import 放在一起）：
```tsx
const OnboardingPage = lazy(() => import('@/pages/onboarding'));
const OnboardingReviewPage = lazy(() => import('@/pages/onboarding-review'));
const OnboardingStatusPage = lazy(() => import('@/pages/onboarding-status'));
```

在 `AuthLayout` 的 children 中添加（与 login、register 同级）：
```tsx
{ path: 'onboarding', element: <OnboardingPage /> },
{ path: 'onboarding-status', element: <OnboardingStatusPage /> },
```

在 `MainLayout` 的 children 中添加（与其他管理页同级）：
```tsx
{ path: 'onboarding-review', element: <OnboardingReviewPage /> },
```

- [ ] **Step 2: 添加侧边栏菜单项**

在 `MainLayout.tsx` 的 `menuItems` 数组中添加：

```tsx
{ key: '/onboarding-review', icon: <AuditOutlined />, label: '入驻审核' },
```

注意：`AuditOutlined` 已被审计日志使用，改用其他图标，例如：

```tsx
import { ShopOutlined } from '@ant-design/icons';
// ...
{ key: '/onboarding-review', icon: <ShopOutlined />, label: '入驻审核' },
```

- [ ] **Step 3: 登录页添加入口**

找到登录页 `sass-kb-admin/src/pages/login/index.tsx`。在已有「注册」链接附近，添加「商家入驻」链接：

```tsx
{/* 在注册链接旁边添加 */}
<Link to="/onboarding">商家入驻</Link>
```

- [ ] **Step 4: Commit**

```bash
git add sass-kb-admin/src/routes/index.tsx sass-kb-admin/src/layouts/MainLayout.tsx sass-kb-admin/src/pages/login/index.tsx
git commit -m "feat(onboarding): 路由注册 + 菜单集成 + 登录页入口"
```

---

### Task 13: 编译及验证

- [ ] **Step 1: 后端编译**

```bash
cd sass-kb-server && mvn clean compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 2: 前端编译**

```bash
cd sass-kb-admin && npx tsc --noEmit 2>&1 | head -30
```

Expected: 无 TypeScript 错误

- [ ] **Step 3: 前端 Vite 构建**

```bash
cd sass-kb-admin && npm run build 2>&1 | tail -10
```

Expected: 构建成功

- [ ] **Step 4: 启动后端验证接口**

```bash
cd sass-kb-server && mvn spring-boot:run -pl sass-kb-web -q &
sleep 15
# 测试公开接口
curl -s -X POST http://localhost:8080/api/onboarding/apply \
  -H 'Content-Type: application/json' \
  -d '{"companyName":"测试公司","creditCode":"123456789012345678","username":"test001","password":"123456","realName":"测试人"}' | python3 -m json.tool
```

Expected: 返回 `{ "code": 200, "message": "success", "data": "<applicationId>" }`

- [ ] **Step 5: 测试管理员审核接口**

先用 admin 登录获取 token，然后测试审核：
```bash
# 登录获取 token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"account":"admin","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# 查看申请列表
curl -s http://localhost:8080/api/onboarding/applications?status=pending \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 审核通过（替换 {id} 为实际申请 ID）
curl -s -X POST http://localhost:8080/api/onboarding/applications/{id}/approve \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Expected: 返回 `status: "approved"`, `tenantId` 和 `userId` 非空

- [ ] **Step 6: 验证数据库**

```bash
# 连接 PostgreSQL 验证
psql -h localhost -U sasskb -d sasskb -c "SELECT id, company_name, status FROM merchant_application;"
psql -h localhost -U sasskb -d sasskb -c "SELECT id, name, source FROM tenant WHERE source='onboarding';"
```

Expected: application 表有记录，tenant 表有 source='onboarding' 的租户

- [ ] **Step 7: 启动前端验证页面**

```bash
cd sass-kb-admin && npm run dev &
```

浏览器访问：
- `http://localhost:5173/onboarding` — 入驻申请页
- `http://localhost:5173/onboarding-review` — 审核页（需登录 admin）
- `http://localhost:5173/onboarding-status?applicationId=xxx` — 进度查询

- [ ] **Step 8: 停止服务并提交**

```bash
# 停止后台服务
kill %1 %2 2>/dev/null

git add -A
git commit -m "chore(onboarding): 验证完成"
```

---

## 实施顺序建议

按 Task 编号依次执行：

```
Task 1  (模块创建)      ── 后续所有 Task 的依赖
Task 2  (数据库迁移)    ── 可与 Task 1 并行
Task 3  (Entity+Mapper) ── 依赖 Task 1
Task 4  (DTOs)          ── 依赖 Task 1
Task 5  (Service)       ── 依赖 Task 3, 4
Task 6  (Controller)    ── 依赖 Task 4, 5
Task 7  (配置修改)      ── 依赖 Task 6
Task 8  (前端 API)      ── 可独立进行
Task 9  (申请页)        ── 依赖 Task 8
Task 10 (审核页)        ── 依赖 Task 8
Task 11 (进度页)        ── 依赖 Task 8
Task 12 (路由菜单)      ── 依赖 Task 9, 10, 11
Task 13 (验证)          ── 依赖全部 Task
```
