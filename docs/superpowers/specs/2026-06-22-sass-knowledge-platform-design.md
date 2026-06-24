# SASS 知识平台管理 — 系统设计文档

**日期：** 2026-06-22
**版本：** v1.0
**状态：** 待 Review

---

## 1. 需求画像

| 维度 | 决策 |
|------|------|
| 产品形态 | 企业知识库（SaaS 多租户） |
| 租户模式 | 公共文库 + 企业私有空间（混合模式） |
| 内容形态 | 富文本文档 + 文件管理 + 结构化数据（全覆盖） |
| 权限模型 | 文档级细粒度权限（空间/文件夹/文档），RBAC + ACL |
| APP 定位 | 全功能（浏览 + 编辑 + 管理） |
| 协作模式 | 异步协作：版本记录 + 差异对比，无实时同步 |
| 团队规模 | 4-8 人，前后端并行开发 |

---

## 2. 架构方案

采用**模块化单体 + 清晰分层**架构：一个 Java 应用部署，内部按业务模块严格分层。未来可无痛拆分为微服务。

```
┌─────────────────────────────────────────────────┐
│                   Nginx / Gateway                │
├──────────────────────┬──────────────────────────┤
│  React Admin (TS)   │     React Native APP      │
│  Ant Design + Vite  │     Expo (managed)        │
├──────────────────────┴──────────────────────────┤
│              REST API (JWT Auth)                 │
├─────────────────────────────────────────────────┤
│           Java Backend (Spring Boot 3 + JDK 17)  │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ 用户 &   │ │ 文档     │ │ 文件         │    │
│  │ 租户     │ │ 知识库   │ │ 存储         │    │
│  │ 权限     │ │ 搜索     │ │ 预览         │    │
│  └──────────┘ └──────────┘ └──────────────┘    │
│  ┌──────────┐ ┌──────────┐                     │
│  │ 协作     │ │ 通用     │                     │
│  │ 版本     │ │ 通知     │                     │
│  │ 评论     │ │ 审计     │                     │
│  └──────────┘ └──────────┘                     │
├─────────────────────────────────────────────────┤
│  PostgreSQL  │  Elasticsearch 8 │  MinIO        │
│              │  (IK 中文分词)   │               │
├─────────────────────────────────────────────────┤
│  Redis       │  RabbitMQ        │               │
└─────────────────────────────────────────────────┘
```

---

## 3. 技术选型

### 3.1 管理后台（React + Ant Design + TypeScript）

| 项目 | 选型 | 理由 |
|------|------|------|
| 构建工具 | Vite | 开发体验优于 CRA |
| 状态管理 | Zustand | 轻量、TS 友好 |
| 路由 | React Router v6 | 社区标配 |
| 请求 | Axios + TanStack Query | 请求发器 + 缓存/刷新/乐观更新 |
| 富文本编辑器 | Tiptap | 基于 ProseMirror，扩展性强，支持 Markdown 快捷输入 |
| 文件预览 | react-pdf / docx-preview | 常见格式预览 |
| 代码规范 | ESLint + Prettier + Husky | 代码质量门禁 |

### 3.2 APP 端（React Native + Expo）

| 项目 | 选型 | 理由 |
|------|------|------|
| 框架 | Expo managed workflow | 免原生构建烦恼，OTA 热更新 |
| 状态管理 | Zustand | 与 Web 端共享模式 |
| 导航 | React Navigation v6 | RN 社区标配 |
| 请求 | Axios + TanStack Query | 与 Web 统一数据层思路 |
| 富文本 | WebView + Tiptap | 编辑用 WebView 嵌入，与 Web 共用编辑器逻辑 |
| 文件预览 | expo-file-system + react-native-pdf | |
| 安全存储 | expo-secure-store | Token 存储 |

### 3.3 后端（Java）

| 项目 | 选型 | 理由 |
|------|------|------|
| 框架 | Spring Boot 3.x + JDK 17 | LTS 版本 |
| ORM | MyBatis-Plus | SQL 可控性强，多租户拦截器成熟 |
| 搜索引擎 | Elasticsearch 8.x | 全文搜索 + IK 中文分词 |
| 文件存储 | MinIO | 兼容 S3，可私有化部署 |
| 富文本处理 | 服务端存 Tiptap JSON + 渲染 HTML | |
| 版本 diff | java-diff-utils | 文本级差异对比 |
| API 文档 | Knife4j | Swagger 增强，便于联调 |
| 缓存 | Redis + Caffeine（两级） | 权限信息本地+远程缓存 |
| 消息队列 | RabbitMQ | 异步通知、ES 索引同步 |

---

## 4. 后端模块设计

### 4.1 后端项目结构

```
sass-kb-server/
├── sass-kb-common/          # 公共工具、异常、注解
├── sass-kb-tenant/          # 租户管理、数据隔离
├── sass-kb-auth/            # 认证授权、RBAC 权限
├── sass-kb-doc/             # 文档 CRUD、富文本、版本管理
├── sass-kb-file/            # 文件上传、预览、存储
├── sass-kb-search/          # ES 搜索引擎封装
├── sass-kb-collaboration/   # 评论、版本 diff、异步协作
├── sass-kb-notification/    # 消息通知
└── sass-kb-web/             # Spring Boot 启动入口、统一 API
```

### 4.2 租户 & 用户

- **隔离策略：** 共享表 + `tenant_id` 字段，MyBatis-Plus 拦截器自动追加 `WHERE tenant_id = ?`
- **公共文库：** `tenant_id = NULL` 或固定公共租户 ID，默认只读
- **认证：** JWT（AccessToken 30min + RefreshToken 7d），bcrypt 密码加密
- **权限模型：** RBAC + 文档级 ACL，deny 优先于 allow，结果用 Caffeine + Redis 二级缓存

### 4.3 文档模型

```json
{
  "id": "doc_abc123",
  "space_id": "space_x",
  "folder_id": "folder_y",
  "title": "产品需求文档",
  "content_json": { "type": "doc", "content": [...] },
  "content_html": "<h1>产品需求文档</h1>...",
  "status": "published",
  "version": 7,
  "tenant_id": "tenant_z",
  "created_by": "user_1",
  "updated_by": "user_1",
  "created_at": "...",
  "updated_at": "..."
}
```

### 4.4 异步协作版本控制

- 用户保存时带 `version` 字段，服务端乐观锁检查
- 版本匹配 → 写入新版本 + record 到 `document_version` 表
- 版本冲突 → 返回 409 + diff 信息，用户选择覆盖或查看差异
- diff 基于 java-diff-utils 做文本级对比

### 4.5 文件管理

- 上传 → MinIO `putObject(tenant_id/uuid/filename)` → file_asset 表记录
- 下载/预览 → 生成预签名 URL（30min 有效期），302 跳转
- 预览：PDF/图片直接展示，Office 转 PDF 或图片兜底

### 4.6 搜索

- 异步索引同步：文档变更 → RabbitMQ → ES Consumer → 更新索引（最终一致）
- 搜索 API 多字段匹配（title^3, content_html, 文件名），租户过滤 + 权限过滤
- 返回高亮片段 + 面包屑路径

### 4.7 通知 & 审计

- 通知：评论/被@/权限变更 → MQ → 通知服务 → 站内信（+ 可选邮件）
- 审计：关键操作（删除、权限变更、导出）记录审计日志表，不可删除

### 4.8 数据库核心表

```
tenant (租户)
  ├── user (用户，关联多租户)
  ├── space (知识空间：公共区 / 企业私有区)
  │     ├── folder (文件夹，树形结构)
  │     │     └── document (文档，含 content_json / content_html)
  │     │           └── document_version (历史版本)
  │     │           └── comment (评论)
  │     └── file_asset (上传的附件)
  ├── permission_rule (权限规则：user/role → space/folder/doc → read/write/admin)
  └── role (自定义角色)
```

---

## 5. 管理后台设计

### 5.1 目录结构

```
sass-kb-admin/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/              # 路由配置 + AuthGuard + TenantGuard
│   ├── layouts/             # MainLayout / AuthLayout
│   ├── pages/               # login, dashboard, space, doc, file,
│   │                        #   tenant, user, role, search, audit
│   ├── components/
│   │   ├── common/          # Loading, ErrorBoundary, ConfirmDelete
│   │   ├── doc/             # DocEditor, DocToolbar, DocOutline,
│   │   │                    #   VersionHistory, VersionDiff, DocBreadcrumb
│   │   ├── tree/            # SpaceTree, FolderPicker
│   │   └── permission/      # PermissionModal, PermissionTag
│   ├── stores/              # authStore, spaceStore, docStore, uiStore
│   ├── hooks/               # useAuth, usePermission, useDocument, useUpload
│   ├── services/            # Axios 实例 + 各模块 service
│   ├── types/               # doc, space, user, common
│   └── utils/               # token, format, constants
└── vite.config.ts
```

### 5.2 文档编辑页布局

```
┌────────────────────────────────────────────────────────┐
│ [←返回] [标题: ___________] [状态: 已发布 ▾] [保存]    │  顶栏
├────────────┬───────────────────────────────────────────┤
│            │  Tiptap 工具栏                            │
│  目录树    │  ─────────────────────────────────────    │
│  (可折叠)  │                                          │
│            │  富文本编辑区                             │
│  ├ 产品    │  (支持 Markdown 快捷输入)                 │
│  │ ├ PRD   │                                          │
│  │ ├ 原型  │                                          │
│  ├ 技术    │                                          │
│  │ ├ API   │                                          │
│            ├───────────────────────────────────────────┤
│            │  评论区域（可选展开）                      │
└────────────┴───────────────────────────────────────────┘
```

### 5.3 关键交互

| 交互 | 实现方式 |
|------|---------|
| 左侧目录树 | Ant Design Tree，懒加载子节点，支持拖拽移动 |
| 编辑器 | Tiptap，扩展：@提及、图片粘贴上传、代码块 |
| 自动保存 | 防抖 2s + 草稿存 localStorage，切换文档时提醒恢复 |
| 版本冲突 | 保存时 409 → 弹窗展示 diff → 用户选择覆盖或查看差异 |
| 权限控制 | `usePermission(resource, id, action)` 返回 boolean，控制 UI 显隐 |

---

## 6. APP 端设计

### 6.1 目录结构

```
sass-kb-app/
├── src/
│   ├── App.tsx
│   ├── navigation/          # RootNavigator, AuthNavigator, MainTab, DocNavigator
│   ├── screens/             # Login, Home, SpaceList, DocList, DocDetail,
│   │                        #   DocEdit, Search, Profile, Notification, FilePreview
│   ├── components/          # DocCard, SpaceCard, SearchBar, EmptyState, CommentList
│   ├── stores/              # authStore, docStore
│   ├── services/            # api, docService, searchService
│   ├── hooks/               # useAuth, useNetworkStatus
│   ├── types/               # 与 admin 共享类型定义
│   └── utils/               # token (SecureStore), constants
```

### 6.2 富文本方案（APP 端关键点）

- **浏览：** WebView 渲染服务端返回的 content_html，注入移动端自适应 CSS
- **编辑：** WebView 加载 Tiptap 编辑器，postMessage 传入/传出 content_json
- 与 Web 端共享编辑器核心逻辑

### 6.3 底部 Tab

```
工作台（首页） │ 知识库（空间） │ 搜索 │ 消息 │ 我的
```

### 6.4 离线策略

| 场景 | 处理 |
|------|------|
| 文档列表 | TanStack Query 缓存，离线可展示上次数据 |
| 文档详情 | 查看过的文档 HTML 缓存到 AsyncStorage |
| 编辑 | 必须在线上传（避免冲突），弱网提示 |
| 文件预览 | 已下载的 PDF 可离线查看 |

---

## 7. 核心数据流

### 7.1 文档保存流程

```
Client                    Server
  │  提交保存              │
  │  {version:7, content}  │
  │ ─────────────────────> │ 乐观锁检查 version
  │                        │ ├─ 匹配 → 写 v8 → 发 MQ → 200
  │                        │ └─ 冲突 → 409 + diff
  │                        │
  │                        │ MQ → ES 索引更新 + 通知
```

### 7.2 搜索流程

```
Client → GET /api/search?q=关键词&space_id=&page=1
       → 后端获取当前用户 tenant_id + 权限范围
       → ES 查询（tenant 过滤 + 权限过滤）
       → 返回 { hits: [...高亮+面包屑], total }
```

### 7.3 三种内容形态处理

| 类型 | 存储路径 | 索引 | 渲染 |
|------|---------|------|------|
| 富文本 | Tiptap JSON → DB | content_html 入 ES | 前端 Tiptap / WebView 渲染 HTML |
| 文件 | MinIO + file_asset 表 | 文件名+元数据入 ES | PDF/Office 预览 |
| 结构化 | 自定义 Schema → JSONB | 关键字段入 ES | 表格/卡片渲染 |

---

## 8. 开发阶段

| 阶段 | 周期 | 内容 | 产出 |
|------|------|------|------|
| Phase 1：地基 | 2-3 周 | 项目骨架、用户/租户 CRUD、JWT 认证、租户拦截器、登录页、布局框架 | 能登录、区分租户的空壳 |
| Phase 2：知识库核心 | 3-4 周 | 空间/文件夹/文档 CRUD、版本管理、Tiptap 编辑器、目录树 | 能创建空间、写文档、看历史 |
| Phase 3：文件 & 搜索 | 2-3 周 | MinIO 上传/预览、ES 索引同步、搜索 API、文件管理界面 | 能上传附件、全文搜索 |
| Phase 4：权限 & 协作 | 2-3 周 | RBAC + ACL、权限管理界面、评论、@提及、版本 diff | 完整权限 + 异步协作 |
| Phase 5：公共文库 & 通知 | 1-2 周 | 公共空间、通知服务、审计日志、消息中心 | 混合租户模式完整运行 |
| Phase 6：打磨 & 上线 | 1-2 周 | 性能优化、压测、安全审计、CI/CD | 生产就绪 |

**预计总周期：** 11-17 周（约 3-4 个月），前后端并行开发。

---

## 9. 待决策项

以下点暂未在讨论中确定，后续可补充：

- [ ] 结构化内容的具体 Schema 设计（表格字段类型、筛选条件等）
- [ ] 邮件通知服务选型（自建 SMTP / 第三方如阿里云邮件推送）
- [ ] CI/CD 方案（GitHub Actions / Jenkins / 阿里云效）
- [ ] 部署方案（自建服务器 / 阿里云 / 腾讯云）
- [ ] 是否需要国际化（多语言）
- [ ] 监控告警方案（Prometheus + Grafana / 云厂商监控）
