# 角色权限 + 文件系统升级 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清理冗余数据、精炼三级角色系统、支持 MP4 上传、实现 Monaco Editor 在线文件编辑

**Architecture:** 后端提取共享 Service 消除角色创建重复，注册时自动分配角色；文件模块新增文本内容读写 API；前端新增文件预览/编辑页面，按 MIME 类型分流渲染策略

**Tech Stack:** Java 17 + Spring Boot 3 + MyBatis-Plus, React 19 + TypeScript + Ant Design 6 + Monaco Editor + TanStack Query, MinIO

## Global Constraints

- 文件大小限制保持 50MB
- 视频不进行服务端转码，使用浏览器原生 `<video>` 播放
- 在线编辑仅支持文本类文件（.txt, .csv, .json, .md, .xml, .yml, .html, .css, .js, .ts 等）
- Office 文件（.docx/.xlsx/.pptx）提示下载本地编辑
- 菜单结构：7 个菜单全部保留
- 角色名称：管理员、普通用户、访客

---

### Task 1: 删除空迁移文件 V9__seed_menus.sql

**Files:**
- Delete: `sass-kb-server/sass-kb-web/src/main/resources/db/migration/V9__seed_menus.sql`

- [ ] **Step 1: 删除空迁移文件**

```bash
rm "sass-kb-server/sass-kb-web/src/main/resources/db/migration/V9__seed_menus.sql"
```

- [ ] **Step 2: 提交**

```bash
git add "sass-kb-server/sass-kb-web/src/main/resources/db/migration/V9__seed_menus.sql"
git commit -m "chore: remove empty V9 migration file"
```

---

### Task 2: 创建 RoleService 并提取默认角色初始化逻辑

**Files:**
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/service/RoleService.java`
- Modify: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/controller/RoleController.java:155-206`
- Modify: `sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/service/MerchantApplicationService.java:152-178`

**Interfaces:**
- Produces: `RoleService.initDefaultRoles(String tenantId): List<Role>` — 创建三个默认角色（管理员、普通用户、访客），若租户已有角色则返回空列表
- Produces: `RoleService.findByName(String tenantId, String name): Role` — 按名称查找角色，找不到抛 BizException(404)

- [ ] **Step 1: 创建 RoleService**

```java
// sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/service/RoleService.java
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
```

- [ ] **Step 2: 重构 RoleController.initDefaults() 调用 RoleService**

修改 `RoleController.java`，将 `initDefaults()` 方法体替换为调用 `roleService.initDefaultRoles()`：

```java
// 在 RoleController 顶部注入 RoleService
private final RoleService roleService;

// 替换 initDefaults() 方法（第 155-206 行）：
@PostMapping("/init-defaults")
public R<List<Role>> initDefaults() {
    String tenantId = TenantContext.getCurrentTenantId();
    List<Role> created = roleService.initDefaultRoles(tenantId);
    if (!created.isEmpty()) {
        permissionService.invalidateCache();
    }
    return R.ok(created);
}
```

同时移除 RoleController 中不再需要的 import：
- 删除 `import cn.hutool.core.util.IdUtil;`
- 删除 `import com.sass.kb.auth.entity.Role;`（为 Role 类型引用保留，构造函数中不再需要 new Role()，但 `List<Role>` 返回类型和注入 `RoleService` 仍需要）

- [ ] **Step 3: 重构 MerchantApplicationService.approve() 调用 RoleService**

修改 `MerchantApplicationService.java`，将 approve() 中的角色创建代码替换为调用 `roleService.initDefaultRoles()`。

注入 RoleService：
```java
// 在已有 field 后添加
private final com.sass.kb.auth.service.RoleService roleService;
```

替换 approve() 方法中第 152-178 行（三步创建角色代码）：
```java
// 3. 初始化默认角色
roleService.initDefaultRoles(tenant.getId());
```

移除不再需要的 import：
- 删除 `import com.sass.kb.auth.entity.Role;`
- 删除 `import com.sass.kb.auth.mapper.RoleMapper;`
- 注意保留 `RoleMapper` 的 import 如果其他地方还在用 — 检查后确认已不需要，只有 approve() 使用

- [ ] **Step 4: 提交**

```bash
git add sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/service/RoleService.java
git add sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/controller/RoleController.java
git add sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/service/MerchantApplicationService.java
git commit -m "refactor: extract initDefaultRoles into shared RoleService"
```

---

### Task 3: 入驻审批通过后自动创建菜单

**Files:**
- Modify: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/service/MenuService.java:22-57`
- Modify: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/controller/MenuController.java:95-215`
- Modify: `sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/service/MerchantApplicationService.java:119-206`

**Interfaces:**
- Consumes: 现有 `MenuMapper`, `IdUtil`
- Produces: `MenuService.initDefaultMenus(String tenantId): List<Menu>`

- [ ] **Step 1: 在 MenuService 中添加 initDefaultMenus 方法**

在 `MenuService.java` 的 `deleteRecursive()` 方法之后添加：

```java
public List<Menu> initDefaultMenus(String tenantId) {
    List<Menu> created = new java.util.ArrayList<>();

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
```

需要在文件顶部添加 import：
```java
import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.entity.Menu;
```

- [ ] **Step 2: 重构 MenuController.initDefaults() 调用 MenuService**

修改 `MenuController.java` 注入 `MenuService`：
```java
private final MenuService menuService;
```

替换 `initDefaults()` 方法体（第 95-215 行全部）：
```java
@PostMapping("/init-defaults")
public R<List<Menu>> initDefaults() {
    String tenantId = TenantContext.getCurrentTenantId();
    return R.ok(menuService.initDefaultMenus(tenantId));
}
```

移除不再需要的 import：
- 删除 `import cn.hutool.core.util.IdUtil;`

- [ ] **Step 3: 在入驻审批中调用菜单初始化**

修改 `MerchantApplicationService.java` 的 `approve()` 方法，在角色初始化之后添加菜单初始化。

注入 MenuService：
```java
// 在已有 field 后添加
private final com.sass.kb.auth.service.MenuService menuService;
```

在 approve() 方法中，角色初始化之后（原步骤 3 之后）添加：
```java
// 3. 初始化默认角色
roleService.initDefaultRoles(tenant.getId());

// 4. 初始化默认菜单
menuService.initDefaultMenus(tenant.getId());
```

原步骤 4（更新申请状态）和步骤 5（发送通知）的编号顺延为步骤 5 和步骤 6。

- [ ] **Step 4: 提交**

```bash
git add sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/service/MenuService.java
git add sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/controller/MenuController.java
git add sass-kb-server/sass-kb-onboarding/src/main/java/com/sass/kb/onboarding/service/MerchantApplicationService.java
git commit -m "refactor: extract initDefaultMenus + auto-create menus on onboarding approval"
```

---

### Task 4: 清理 Dashboard 死数据 (recentDocs)

**Files:**
- Modify: `sass-kb-server/sass-kb-web/src/main/java/com/sass/kb/controller/DashboardController.java:58`
- Modify: `sass-kb-admin/src/services/authService.ts:5-15`

- [ ] **Step 1: 移除后端 recentDocs**

在 `DashboardController.java` 第 58 行删除：
```java
result.put("recentDocs", new ArrayList<>());
```

同时移除不再需要的 import：
- 删除 `import java.util.ArrayList;`
- 删除 `import java.util.List;`

- [ ] **Step 2: 移除前端 recentDocs 类型定义**

修改 `authService.ts` 的 `DashboardStats` 接口：

```typescript
export interface DashboardStats {
  files: number;
  users: number;
  tenants: number;
}
```

- [ ] **Step 3: 提交**

```bash
git add sass-kb-server/sass-kb-web/src/main/java/com/sass/kb/controller/DashboardController.java
git add sass-kb-admin/src/services/authService.ts
git commit -m "chore: remove unused recentDocs from dashboard"
```

---

### Task 5: 自注册用户自动分配普通用户角色

**Files:**
- Modify: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/service/AuthService.java:75-100`

**Interfaces:**
- Consumes: `RoleService.initDefaultRoles(tenantId)`, `RoleService.findByName(tenantId, name)`

- [ ] **Step 1: 修改 AuthService.register() 在创建用户后分配角色**

在 `AuthService.java` 中注入依赖并修改 register() 方法。

添加注入字段：
```java
private final RoleService roleService;
private final PermissionRuleMapper permissionRuleMapper;
```

添加 import：
```java
import com.sass.kb.auth.entity.PermissionRule;
import com.sass.kb.auth.mapper.PermissionRuleMapper;
```

修改 register() 方法，在 `userMapper.insert(user)` 成功后（第 94 行}之前）添加：

```java
// 3. 自动分配「普通用户」角色
try {
    roleService.initDefaultRoles(tenantId);
    Role normalRole = roleService.findByName(tenantId, "普通用户");
    PermissionRule pr = new PermissionRule();
    pr.setId(IdUtil.fastSimpleUUID());
    pr.setTenantId(tenantId);
    pr.setSubjectType("user");
    pr.setSubjectId(user.getId());
    pr.setTargetType("role");
    pr.setTargetId(normalRole.getId());
    pr.setAction("member");
    pr.setEffect("allow");
    permissionRuleMapper.insert(pr);
} catch (Exception e) {
    log.warn("为新注册用户分配默认角色失败: userId={}, tenantId={}", user.getId(), tenantId);
}
```

需要在类上添加 `@Slf4j` 注解和对应 import `lombok.extern.slf4j.Slf4j`。

- [ ] **Step 2: 提交**

```bash
git add sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/service/AuthService.java
git commit -m "feat: auto-assign normal user role on self-registration"
```

---

### Task 6: 添加 MP4 视频上传支持

**Files:**
- Modify: `sass-kb-server/sass-kb-file/src/main/java/com/sass/kb/file/controller/FileController.java:28-39`

- [ ] **Step 1: 在 MIME 白名单中添加 video/mp4**

修改 `FileController.java` 的 `ALLOWED_MIME_TYPES`：

```java
private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        "application/pdf",
        "text/plain", "text/csv",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip", "application/x-7z-compressed", "application/x-rar-compressed",
        "video/mp4"
);
```

- [ ] **Step 2: 提交**

```bash
git add sass-kb-server/sass-kb-file/src/main/java/com/sass/kb/file/controller/FileController.java
git commit -m "feat: allow MP4 video file upload"
```

---

### Task 7: 添加文件内容读写 API

**Files:**
- Modify: `sass-kb-server/sass-kb-file/src/main/java/com/sass/kb/file/controller/FileController.java:94-111`
- Modify: `sass-kb-server/sass-kb-file/src/main/java/com/sass/kb/file/service/FileService.java:116-143`

**Interfaces:**
- Produces: `GET /api/file/{id}/content` → 返回文件文本内容
- Produces: `PUT /api/file/{id}/content` → 保存文本内容覆盖原文件

- [ ] **Step 1: 在 FileService 中添加 getContent 和 saveContent 方法**

在 `FileService.java` 的 `downloadToStream()` 方法之后添加：

```java
private static final Set<String> TEXT_MIME_TYPES = Set.of(
        "text/plain", "text/csv", "application/json",
        "text/markdown", "text/xml", "text/html",
        "text/css", "text/javascript", "application/javascript",
        "text/x-java-source", "text/x-python", "text/x-sh",
        "application/xml", "text/yaml"
);

private static final Set<String> TEXT_EXTENSIONS = Set.of(
        "txt", "csv", "json", "md", "xml", "yml", "yaml", "html", "htm",
        "css", "js", "ts", "jsx", "tsx", "java", "py", "sh", "bat",
        "sql", "properties", "ini", "cfg", "conf", "log", "env", "gitignore"
);

public String getContent(String id) {
    FileAsset asset = fileAssetMapper.selectById(id);
    if (asset == null) {
        throw new BizException(404, "文件不存在");
    }
    if (!isTextFile(asset)) {
        throw new BizException(400, "该文件类型不支持在线编辑");
    }
    try (InputStream stream = minioClient.getObject(GetObjectArgs.builder()
            .bucket(minioProperties.getBucket())
            .object(asset.getStorePath())
            .build())) {
        return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
    } catch (BizException e) {
        throw e;
    } catch (Exception e) {
        throw new BizException("读取文件内容失败: " + e.getMessage());
    }
}

public void saveContent(String id, String content) {
    FileAsset asset = fileAssetMapper.selectById(id);
    if (asset == null) {
        throw new BizException(404, "文件不存在");
    }
    if (!isTextFile(asset)) {
        throw new BizException(400, "该文件类型不支持在线编辑");
    }
    byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
    if (bytes.length > MAX_FILE_SIZE) {
        throw new BizException(400, "文件大小超过限制 (最大 50MB)");
    }
    try {
        minioClient.putObject(PutObjectArgs.builder()
                .bucket(minioProperties.getBucket())
                .object(asset.getStorePath())
                .stream(new java.io.ByteArrayInputStream(bytes), bytes.length, -1)
                .contentType(asset.getMimeType())
                .build());
        // 更新文件大小
        asset.setFileSize((long) bytes.length);
        fileAssetMapper.updateById(asset);
    } catch (Exception e) {
        throw new BizException("保存文件失败: " + e.getMessage());
    }
}

private boolean isTextFile(FileAsset asset) {
    String mimeType = asset.getMimeType();
    if (mimeType != null && TEXT_MIME_TYPES.contains(mimeType)) {
        return true;
    }
    String name = asset.getOriginalName();
    if (name != null) {
        int dot = name.lastIndexOf('.');
        if (dot >= 0) {
            String ext = name.substring(dot + 1).toLowerCase();
            return TEXT_EXTENSIONS.contains(ext);
        }
    }
    return false;
}
```

需要添加 import：
```java
import java.io.ByteArrayInputStream;
import java.util.Set;
```

在类顶部添加常量（已有 `MAX_FILE_SIZE` 的情况下，在 `minioProperties` 字段之后添加）：
```java
private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
```
这个常量已存在（在 `FileController` 中），但在 `FileService` 中不重复定义，改用引用或复用。由于 `saveContent` 需要校验大小，将 `MAX_FILE_SIZE` 从 `FileController` 移动到 `FileService` 或直接内联。此处选择在 `FileService` 中定义：

```java
private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;
```

- [ ] **Step 2: 在 FileController 中添加 content 端点**

在 `FileController.java` 的 `delete()` 方法之后，`list()` 方法之前添加：

```java
@Operation(summary = "获取文件文本内容")
@GetMapping("/{id}/content")
public R<String> getContent(@PathVariable String id) {
    return R.ok(fileService.getContent(id));
}

@Operation(summary = "保存文件文本内容")
@PutMapping("/{id}/content")
public R<Void> saveContent(@PathVariable String id, @RequestBody String content) {
    fileService.saveContent(id, content);
    eventPublisher.publish(EntityEvent.of("UPDATED", "FILE", id, TenantContext.getCurrentTenantId()));
    return R.ok();
}
```

在 `FileController` 顶部添加 import：
```java
import org.springframework.web.bind.annotation.PutMapping;
```
检查是否已有 `@PutMapping` import — 查看现有代码，如果没有则添加。现有 controller 只有 `@PostMapping`, `@GetMapping`, `@DeleteMapping`，需要新增 PutMapping import。

- [ ] **Step 3: 提交**

```bash
git add sass-kb-server/sass-kb-file/src/main/java/com/sass/kb/file/controller/FileController.java
git add sass-kb-server/sass-kb-file/src/main/java/com/sass/kb/file/service/FileService.java
git commit -m "feat: add file content read/write API for online editing"
```

---

### Task 8: 前端 — 安装 Monaco Editor + 添加 API

**Files:**
- Modify: `sass-kb-admin/package.json`
- Modify: `sass-kb-admin/src/services/fileService.ts:16-33`

**Interfaces:**
- Produces: `fileApi.getContent(id)`, `fileApi.saveContent(id, content)`

- [ ] **Step 1: 安装 @monaco-editor/react**

```bash
cd sass-kb-admin && npm install @monaco-editor/react
```

- [ ] **Step 2: 在 fileService.ts 添加新 API 方法**

在 `fileService.ts` 的 `fileApi` 对象中添加（`list` 方法之后）：

```typescript
getContent: (id: string) =>
  api.get<any, ApiResponse<string>>(`/file/${id}/content`),
saveContent: (id: string, content: string) =>
  api.put<any, ApiResponse<void>>(`/file/${id}/content`, content),
```

- [ ] **Step 3: 提交**

```bash
git add sass-kb-admin/package.json sass-kb-admin/package-lock.json
git add sass-kb-admin/src/services/fileService.ts
git commit -m "feat: add Monaco Editor dep + file content API client"
```

---

### Task 9: 前端 — 创建文件预览/编辑器组件

**Files:**
- Create: `sass-kb-admin/src/components/file/FilePreview.tsx`
- Create: `sass-kb-admin/src/pages/file/preview.tsx`
- Modify: `sass-kb-admin/src/routes/index.tsx:1-41`

**Interfaces:**
- Consumes: `GET /api/file/{id}` 获取文件信息, `GET /api/file/{id}/content` 获取内容
- Consumes: `PUT /api/file/{id}/content` 保存内容
- Produces: `FilePreview` 组件, `FilePreviewPage` 页面组件, 路由 `/file/:id/preview`

- [ ] **Step 1: 创建 FilePreview 组件**

创建文件 `sass-kb-admin/src/components/file/FilePreview.tsx`：

```tsx
import { useState, useEffect } from 'react';
import { Spin, Button, message, Result, Typography } from 'antd';
import { DownloadOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fileApi } from '@/services/fileService';
import type { FileAsset } from '@/services/fileService';

const { Text } = Typography;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const TEXT_TYPES = [
  'text/plain', 'text/csv', 'application/json',
  'text/markdown', 'text/xml', 'text/html',
  'text/css', 'text/javascript', 'application/javascript',
];
const TEXT_EXTENSIONS = ['txt', 'csv', 'json', 'md', 'xml', 'yml', 'yaml',
  'html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx', 'java', 'py', 'sh', 'sql', 'properties', 'ini', 'log'];

function isImage(mime: string) { return IMAGE_TYPES.includes(mime); }
function isVideo(mime: string) { return mime === 'video/mp4'; }
function isPdf(mime: string) { return mime === 'application/pdf'; }
function isText(file: FileAsset): boolean {
  if (TEXT_TYPES.includes(file.mimeType)) return true;
  const name = file.originalName?.toLowerCase() || '';
  const ext = name.substring(name.lastIndexOf('.') + 1);
  return TEXT_EXTENSIONS.includes(ext);
}

function getLanguage(file: FileAsset): string {
  const name = file.originalName?.toLowerCase() || '';
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.md')) return 'markdown';
  if (name.endsWith('.xml') || name.endsWith('.html') || name.endsWith('.htm')) return 'xml';
  if (name.endsWith('.css')) return 'css';
  if (name.endsWith('.js') || name.endsWith('.mjs')) return 'javascript';
  if (name.endsWith('.ts')) return 'typescript';
  if (name.endsWith('.tsx')) return 'typescript';
  if (name.endsWith('.jsx')) return 'javascript';
  if (name.endsWith('.py')) return 'python';
  if (name.endsWith('.java')) return 'java';
  if (name.endsWith('.sh') || name.endsWith('.bash')) return 'shell';
  if (name.endsWith('.sql')) return 'sql';
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return 'yaml';
  if (name.endsWith('.csv')) return 'plaintext';
  return 'plaintext';
}

interface Props {
  fileId: string;
  onBack: () => void;
}

export default function FilePreview({ fileId, onBack }: Props) {
  const [editingContent, setEditingContent] = useState<string | null>(null);

  const { data: fileData, isLoading } = useQuery({
    queryKey: ['file', fileId],
    queryFn: () => fileApi.getById(fileId),
  });

  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['file-content', fileId],
    queryFn: () => fileApi.getContent(fileId),
    enabled: !!fileData && isText(fileData.data),
  });

  const saveMut = useMutation({
    mutationFn: (content: string) => fileApi.saveContent(fileId, content),
    onSuccess: () => message.success('保存成功'),
    onError: () => message.error('保存失败'),
  });

  useEffect(() => {
    if (contentData?.data !== undefined) {
      setEditingContent(contentData.data);
    }
  }, [contentData]);

  const file = fileData?.data;

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;
  }

  if (!file) {
    return <Result status="error" title="文件不存在" />;
  }

  const handleDownload = async () => {
    try {
      const res = await fileApi.getDownloadUrl(fileId);
      if (res.data) window.open(res.data, '_blank');
    } catch {
      message.error('下载失败');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button>
          <Text strong style={{ fontSize: 16 }}>{file.originalName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {file.mimeType} · {(file.fileSize / 1024).toFixed(1)} KB
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isText(file) && (
            <Button type="primary" icon={<SaveOutlined />}
              loading={saveMut.isPending}
              onClick={() => editingContent !== null && saveMut.mutate(editingContent)}>
              保存
            </Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>下载</Button>
        </div>
      </div>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden', minHeight: 400 }}>
        {isImage(file.mimeType) && (
          <div style={{ display: 'flex', justifyContent: 'center', background: '#f5f5f5', padding: 24 }}>
            <img src={`/api/file/${fileId}/download-file`} alt={file.originalName}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          </div>
        )}

        {isVideo(file.mimeType) && (
          <div style={{ display: 'flex', justifyContent: 'center', background: '#000', padding: 24 }}>
            <video controls style={{ maxWidth: '100%', maxHeight: '70vh' }}
              src={`/api/file/${fileId}/download-file`}>
              您的浏览器不支持视频播放
            </video>
          </div>
        )}

        {isPdf(file.mimeType) && (
          <iframe src={`/api/file/${fileId}/download-file`}
            style={{ width: '100%', height: '75vh', border: 'none' }} />
        )}

        {isText(file) && (
          contentLoading ? (
            <Spin style={{ display: 'block', padding: 40 }} />
          ) : (
            <Editor
              height="70vh"
              language={getLanguage(file)}
              value={editingContent || ''}
              onChange={(value) => setEditingContent(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          )
        )}

        {!isImage(file.mimeType) && !isVideo(file.mimeType) && !isPdf(file.mimeType) && !isText(file) && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, flexDirection: 'column', gap: 16 }}>
            <Text type="secondary">此文件类型不支持在线预览</Text>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
              下载到本地编辑
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 FilePreviewPage 路由页面**

创建文件 `sass-kb-admin/src/pages/file/preview.tsx`：

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import FilePreview from '@/components/file/FilePreview';

export default function FilePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return <FilePreview fileId={id} onBack={() => navigate('/file')} />;
}
```

- [ ] **Step 3: 添加路由和文件列表预览按钮**

修改 `sass-kb-admin/src/routes/index.tsx`，添加 lazy import 和路由：

在 lazy imports 区域添加：
```typescript
const FilePreviewPage = lazy(() => import('@/pages/file/preview'));
```

在 children 数组中 `/file` 路由之后添加：
```typescript
{ path: 'file/:id/preview', element: <FilePreviewPage /> },
```

- [ ] **Step 4: 在文件列表页添加预览按钮**

修改 `sass-kb-admin/src/pages/file/index.tsx`，在操作列添加预览按钮。

在 import 中添加：
```typescript
import { useNavigate } from 'react-router-dom';
import { EyeOutlined } from '@ant-design/icons';
```

在 `FilePage` 组件顶部添加：
```typescript
const navigate = useNavigate();
```

在 columns 的 action render 中，权限按钮之前添加：
```typescript
<Button type="link" size="small" icon={<EyeOutlined />}
  onClick={() => navigate(`/file/${record.id}/preview`)}>
  预览
</Button>
```

- [ ] **Step 5: 提交**

```bash
git add sass-kb-admin/src/components/file/FilePreview.tsx
git add sass-kb-admin/src/pages/file/preview.tsx
git add sass-kb-admin/src/pages/file/index.tsx
git add sass-kb-admin/src/routes/index.tsx
git commit -m "feat: add online file preview with Monaco Editor for text files"
```

---

## Implementation Order

按依赖关系排列：

```
Task 1 (删除空迁移)     ──┐
                          ├─→ Task 2 (提取 RoleService) ──→ Task 5 (注册分配角色)
                          │              │
Task 4 (Dashboard 死数据) ─┘              └──→ Task 3 (菜单初始化提取 + 入驻自动创建)
                                   
Task 6 (MP4 白名单) ──→ Task 7 (文件内容 API) ──→ Task 8 (前端 Monaco + API) ──→ Task 9 (预览编辑器组件)
```

**可并行：**
- Task 1, Task 4, Task 6 无依赖，可并行执行
- Task 2 完成后，Task 3 和 Task 5 可并行
- Task 7 完成后，Task 8 → Task 9 顺序执行
