# 角色权限 + 文件系统升级 设计文档

日期：2026-07-07

## 一、冗余数据清理

### 1.1 默认角色创建去重

**问题**：`MerchantApplicationService.approve()` 和 `RoleController.initDefaults()` 各自硬编码了相同的三个默认角色。

**方案**：在 `RoleService` 中新增 `initDefaultRoles(String tenantId)` 方法，两处统一调用。

**文件变更**：

| 文件 | 操作 |
|------|------|
| `sass-kb-auth/.../service/RoleService.java` | 新增 `initDefaultRoles(tenantId)` |
| `sass-kb-auth/.../controller/RoleController.java` | `initDefaults()` 改为调用 RoleService |
| `sass-kb-onboarding/.../service/MerchantApplicationService.java` | `approve()` 改为调用 RoleService |

### 1.2 删除空迁移文件

**问题**：`V9__seed_menus.sql` 只有注释，无实际 SQL。

**方案**：删除该文件。其注释内容已在实际代码（`MenuController.initDefaults()`）中体现。

### 1.3 入驻审批通过后自动创建菜单

**问题**：入驻审批通过后自动创建角色，但不创建菜单，导致新租户侧边栏为空。

**方案**：在 `MerchantApplicationService.approve()` 中增加调用 `MenuService.initDefaultMenus(tenantId)`。

**文件变更**：

| 文件 | 操作 |
|------|------|
| `sass-kb-onboarding/.../service/MerchantApplicationService.java` | 注入 MenuService，approve() 中调用 initDefaultMenus |

### 1.4 Dashboard 死数据清理

**问题**：`DashboardController.stats()` 始终返回 `recentDocs: []`，前端类型定义包含该字段但从未渲染。

**方案**：
- 后端：移除 `stats()` 中的 `recentDocs` 字段
- 前端：`authService.ts` 中的 `DashboardStats` 类型移除 `recentDocs`

## 二、三级角色系统精炼

### 2.1 角色定义

| 角色 | 权限 | 说明 |
|------|------|------|
| 管理员 | `*:*` | 全部权限。入驻审批通过的用户自动获得 |
| 普通用户 | `space:read, doc:read, doc:write, file:read, file:write` | 编辑 + 下载 + 读取文件 |
| 访客 | `space:read, doc:read, file:read` | 仅读取 + 下载 |

### 2.2 自注册用户自动分配角色

**问题**：`AuthService.register()` 创建用户后不分配任何角色，导致注册后无法使用系统。

**方案**：注册完成后，查找当前租户的「普通用户」角色并分配。若租户尚无角色，先调用 `RoleService.initDefaultRoles()`。

**文件变更**：

| 文件 | 操作 |
|------|------|
| `sass-kb-auth/.../service/AuthService.java` | register() 增加角色分配逻辑 |
| `sass-kb-auth/.../service/RoleService.java` | 新增 `findByName(tenantId, name)` 方法 |

## 三、文件系统升级

### 3.1 MP4 视频上传

**方案**：在 `FileController.ALLOWED_TYPES` 中增加 `video/mp4`。

**文件变更**：

| 文件 | 操作 |
|------|------|
| `sass-kb-file/.../controller/FileController.java` | ALLOWED_TYPES 增加 `video/mp4` |

大小限制保持 50MB 不变。

### 3.2 在线文件预览与编辑

新增文件预览页面，根据 MIME 类型选择不同渲染策略：

| 文件类型 | 预览方式 |
|---------|---------|
| 图片 (image/*) | `<img>` 原生渲染 |
| 视频 (video/mp4) | `<video>` 播放器 |
| PDF (application/pdf) | `<iframe>` 内嵌预览 |
| 纯文本 (.txt, .csv, .json, .md, .xml, .yml 等) | Monaco Editor，支持在线编辑 + 保存 |
| Office 文档 (.docx/.xlsx/.pptx) | 提示下载到本地编辑 |

### 3.3 文本在线编辑器

- **编辑器选型**：Monaco Editor（VS Code 内核）
- **读取**：新增 `GET /api/file/{id}/content` 接口，以 UTF-8 文本返回文件内容
- **保存**：新增 `PUT /api/file/{id}/content` 接口，接收文本内容并覆盖 MinIO 中的文件
- **语法高亮**：按文件扩展名自动识别语言模式

### 3.4 新增 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/file/{id}/content` | 获取文件文本内容（仅文本类文件） |
| PUT | `/api/file/{id}/content` | 保存编辑后的文本内容 |

### 3.5 前端新增模块

| 文件 | 说明 |
|------|------|
| `sass-kb-admin/src/pages/file/preview.tsx` | 文件预览/编辑页面 |
| `sass-kb-admin/src/components/file/FilePreview.tsx` | 文件预览组件（图片/视频/PDF/文本编辑） |
| `sass-kb-admin/src/services/fileService.ts` | 新增 `getContent()` / `saveContent()` API |

### 3.6 路由变更

| 路由 | 页面 | 说明 |
|------|------|------|
| `/file` | FilePage | 文件列表（已有） |
| `/file/:id/preview` | FilePreviewPage | 新增：文件预览/编辑 |

## 四、边界条件与错误处理

- 非文本文件调用 `/content` API 时返回 400 + 明确错误信息
- 文件编辑保存时校验文件大小不超过 50MB
- 视频播放使用浏览器原生 `<video>` 控件，不做服务端转码
- 预览页面加载失败时展示错误状态，提供下载按钮作为降级方案

## 五、不变更项

- 菜单结构：7 个菜单全部保留
- 文件大小限制：保持 50MB
- 存储机制：保持 MinIO
- 认证机制：保持 JWT + AuthInterceptor
