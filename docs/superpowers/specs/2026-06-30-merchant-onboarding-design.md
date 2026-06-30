# 商家入驻功能 — 设计文档

> 日期：2026-06-30  
> 状态：已确认  
> 关联：SASS 知识平台

---

## 1. 需求概述

为 SASS 知识平台增加**外部商家自助入驻**能力。商家通过在线表单提交企业资质，平台管理员审核后自动开通租户和管理员账号。

### 核心流程

```
商家申请人                              平台管理员
    │                                      │
    ├─ 访问入驻页面                         │
    ├─ 填写企业信息 + 管理员账号             │
    ├─ POST /api/onboarding/apply ────────►│
    │  (状态: pending)                     ├─ 审核列表查看
    │                                      ├─ 查看详情（含营业执照）
    │                                      ├─ 通过 → 自动创建租户+管理员
    │◄── 邮件/系统通知：审核通过 ───────────┤
    │  (可立即登录使用)                     │
    │                                      ├─ 驳回 → 填写原因
    │◄── 邮件/系统通知：审核驳回 ───────────┤
```

### 关键决策

| 维度 | 决策 |
|------|------|
| 入驻方式 | 外部商家自助申请 → 平台审核 |
| 申请信息 | 标准版：营业执照、社会信用代码、公司地址、经营范围、法人信息、企业联系方式 + 管理员账号信息 |
| 审核流程 | 一步审核：提交 → 管理员审核 → 通过/驳回（附原因） |
| 通过后动作 | 自动激活租户 + 创建超级管理员账号，申请人可立即登录 |
| 驳回后 | 不可重新提交（后续版本可扩展） |

---

## 2. 方案选型

选择**方案二：独立入驻模块**，原因：

- 数据模型清晰，申请信息与运营数据分离
- 审核流程独立，易于扩展（补充资料、重新提交等）
- 不影响现有 `tenant` 表和注册逻辑
- 一步审核不需要工作流引擎

不选用方案一（扩展现有表），因为商家申请信息和企业运营信息混在一起，语义不清晰。  
不选用方案三（工作流引擎），因为一步审核场景下严重过度设计。

---

## 3. 数据库设计

### 3.1 新表：`merchant_application`

```sql
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
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ma_credit_code ON merchant_application(credit_code);
CREATE INDEX idx_ma_status ON merchant_application(status);
```

### 3.2 `tenant` 表微调

```sql
ALTER TABLE tenant ADD COLUMN source VARCHAR(20) DEFAULT 'manual';
-- 取值：'manual' | 'onboarding' | 'register'
```

### 3.3 Flyway 迁移

- 新建 `V7__merchant_onboarding.sql`，包含上述 DDL

### 3.4 业务约束

| 规则 | 实现方式 |
|------|----------|
| 社会信用代码唯一 | 唯一索引 + 申请时校验 |
| 用户名唯一 | 查询 `user` 表 + `merchant_application` 表（防止与已有用户重名） |
| 密码存储 | BCrypt，与现有用户密码一致 |
| 营业执照图片 | 上传到 MinIO，表内存 URL |

---

## 4. API 设计

### 4.1 接口清单

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/onboarding/apply` | 公开 | 提交入驻申请 |
| GET | `/api/onboarding/applications` | 管理员 | 分页查询申请列表 |
| GET | `/api/onboarding/applications/{id}` | 管理员 | 查询申请详情 |
| POST | `/api/onboarding/applications/{id}/approve` | 管理员 | 审核通过 |
| POST | `/api/onboarding/applications/{id}/reject` | 管理员 | 审核驳回 |
| GET | `/api/onboarding/status?applicationId={id}` | 公开 | 凭申请ID查询进度 |

### 4.2 接口详情

#### POST /api/onboarding/apply

请求体：
```json
{
  "companyName": "XX科技有限公司",
  "creditCode": "91110108XXXXXXXXXX",
  "licenseUrl": "https://minio-host/bucket/license/uuid.png",
  "legalPerson": "张三",
  "companyAddress": "北京市朝阳区XX路XX号",
  "businessScope": "软件开发、技术咨询",
  "contactPhone": "010-12345678",
  "contactEmail": "company@example.com",
  "username": "zhangsan",
  "password": "xxxxxx",
  "realName": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138000"
}
```

响应：`{ "code": 200, "message": "申请已提交，请等待审核", "data": { "applicationId": "xxx" } }`

校验逻辑：
1. 所有必填字段非空
2. 社会信用代码未被使用（查 `merchant_application` 中 `status != 'rejected'` 的记录）
3. 用户名在 `user` 表和 `merchant_application` 表中均不重复
4. 密码 BCrypt 哈希后存储

#### GET /api/onboarding/applications

查询参数：`status`（可选，默认全部）、`page`、`size`、`keyword`（可选，公司名模糊搜索）

响应：标准 `PageResult` 格式

#### GET /api/onboarding/applications/{id}

返回完整申请信息，含营业执照 URL。

#### POST /api/onboarding/applications/{id}/approve

事务操作：
```
BEGIN
  1. 校验申请状态为 pending
  2. 创建 tenant：name=companyName, status=active, source='onboarding'
  3. 创建 user：关联新 tenant, is_super_admin=true
  4. 初始化该租户的默认角色和权限（调用现有 RoleService.initDefaults）
  5. 更新 merchant_application：status='approved', tenant_id, user_id, reviewed_by, reviewed_at
  6. 发送通知给申请人（系统通知 + 可选邮件）
COMMIT
```

#### POST /api/onboarding/applications/{id}/reject

请求体：`{ "reason": "驳回原因" }`

逻辑：更新 `status='rejected'`、`review_comment`、`reviewed_by`、`reviewed_at`，发送驳回通知。

#### GET /api/onboarding/status?applicationId={id}

公开接口，凭申请 ID 查询进度。提交申请后返回的 `applicationId` 可用于查询。

响应：`{ "code": 200, "data": { "status": "pending", "companyName": "...", "reviewComment": null, ... } }`

### 4.3 AuthInterceptor 白名单

在 `AuthInterceptor` 中放行：
- `/api/onboarding/apply`
- `/api/onboarding/status`

### 4.4 权限控制

审核相关接口（`applications` 列表、详情、`approve`、`reject`）仅限**平台超级管理员**（`isSuperAdmin=true`）访问。在 Controller 方法上通过检查 `request.getAttribute("isSuperAdmin")` 或复用 `@RequirePermission` 实现。

### 4.5 租户行级隔离排除

`merchant_application` 是平台级表，不属于任何租户。需在 `MybatisPlusConfig` 的 `TenantLineInnerInterceptor` 配置中将该表加入忽略列表，与 `tenant`、`user` 表同级。

---

## 5. 前端设计

### 5.1 路由

| 路由 | 页面 | 布局 |
|------|------|------|
| `/onboarding` | 商家入驻申请页 | AuthLayout（无需登录） |
| `/onboarding-review` | 入驻审核页 | MainLayout（需管理员登录） |
| `/onboarding-status` | 申请进度查询 | 可选：AuthLayout 或独立 |

### 5.2 入驻申请页 `/onboarding`

Ant Design `Steps` 分步表单，共三步：

**步骤一：企业信息**
- 公司全称（必填，Input）
- 统一社会信用代码（必填，Input，校验 18 位格式）
- 营业执照（Upload 组件，调用 `/api/file/upload` 上传到 MinIO）
- 法人姓名（Input）
- 公司地址（Input）
- 经营范围（TextArea）
- 联系电话（Input）
- 联系邮箱（Input，校验邮箱格式）

**步骤二：管理员账号**
- 登录账号（必填，Input）
- 登录密码（必填，Input.Password）
- 确认密码（必填，Input.Password，与密码一致性校验）
- 真实姓名（必填，Input）
- 个人邮箱（Input）
- 个人手机（Input）

**步骤三：提交成功**
- 成功图标 + 提示文案
- 查看进度按钮

### 5.3 入驻审核页 `/onboarding-review`

管理后台侧边栏新增「入驻审核」菜单项。

**列表视图：**
- Tab 筛选：全部 | 待审核（badge 数量） | 已通过 | 已驳回
- Ant Design Table：公司名称、信用代码、申请人、提交时间、操作
- 分页

**详情抽屉（Drawer）：**
- 左侧：企业信息区（含营业执照图片预览）
- 右侧：管理员账号信息区
- 底部操作栏：
  - 「通过」按钮（Primary）
  - 「驳回」按钮（Danger）
- 驳回时弹出 Modal 输入驳回原因（必填，TextArea）

### 5.4 入口

- 登录页增加「商家入驻」链接/按钮
- 首页导航栏增加「商家入驻」入口

---

## 6. 后端模块结构

### 6.1 新建模块 `sass-kb-onboarding`

```
sass-kb-onboarding/
└── src/main/java/com/sass/kb/onboarding/
    ├── entity/
    │   └── MerchantApplication.java          -- MyBatis-Plus Entity
    ├── mapper/
    │   └── MerchantApplicationMapper.java    -- MyBatis-Plus BaseMapper
    ├── service/
    │   ├── MerchantApplicationService.java    -- 接口
    │   └── impl/
    │       └── MerchantApplicationServiceImpl.java
    ├── controller/
    │   └── OnboardingController.java          -- REST 控制器
    ├── dto/
    │   ├── ApplyRequest.java                  -- 申请请求 DTO
    │   ├── ApplicationVO.java                 -- 申请记录 VO
    │   └── RejectRequest.java                 -- 驳回请求 DTO
    └── config/
        └── OnboardingAutoConfiguration.java   -- 自动配置（可选）
```

### 6.2 依赖关系

- `sass-kb-onboarding` 依赖 `sass-kb-tenant`（创建租户）、`sass-kb-auth`（创建用户、初始化角色）
- `sass-kb-web` 引入 `sass-kb-onboarding` 模块

### 6.3 Service 实现要点

```
MerchantApplicationServiceImpl:

apply(ApplyRequest):
  1. 校验信用代码唯一性
  2. 校验用户名唯一性（跨 user 表和 application 表）
  3. BCrypt 加密密码
  4. 保存 application (status=pending)
  5. 返回 applicationId

approve(id, reviewerId):
  1. 查询 application（状态必须为 pending）
  2. @Transactional
     a. tenantService.create(name, source='onboarding')
     b. userService.create(tenantId, username, password, realName, isSuperAdmin=true)
     c. roleService.initDefaults(tenantId)  // 初始化默认角色
     d. 更新 application (status=approved, tenantId, userId, reviewedBy)
  3. notificationService.send(...)

reject(id, reviewerId, reason):
  1. 查询 application
  2. 更新 application (status=rejected, reviewComment, reviewedBy)
  3. notificationService.send(...)

listApplications(page, size, status, keyword):
  PageResult 分页查询，按创建时间倒序
```

---

## 7. 测试要点

| 场景 | 验证点 |
|------|--------|
| 正常提交申请 | 表单校验通过，数据库记录正确，返回 applicationId |
| 重复信用代码 | 返回业务错误 |
| 重复用户名 | 返回业务错误 |
| 审核通过 | 租户和用户正确创建，用户可登录 |
| 审核驳回 | 状态更新，驳回原因记录 |
| 已处理的申请再次审批 | 返回错误（只有 pending 可审批） |
| 管理员权限 | 非管理员无法访问审核接口 |
| 文件上传 | 营业执照成功上传到 MinIO，URL 可访问 |

---

## 8. 后续扩展（不在本次范围）

- 申请人补充资料/重新提交
- 邮件通知集成
- 入驻进度短信通知
- 多级审核流程
- 入驻后可选的套餐/版本选择
- 入驻审批的审计日志

---

## 9. 与现有系统的集成点

| 集成点 | 说明 |
|--------|------|
| `AuthInterceptor` | 白名单新增 `/api/onboarding/apply` |
| `TenantService` | 审核通过时调用创建租户 |
| `UserService` | 审核通过时调用创建超级管理员用户 |
| `RoleService` | 审核通过时调用 `initDefaults` 初始化角色 |
| `FileController` | 营业执照上传复用现有 `/api/file/upload` |
| `NotificationService` | 审核结果通知 |
| `MybatisPlusConfig` | 新模块的表不纳入租户行级隔离（merchant_application 不属于任何租户） |
| Flyway 迁移 | V7 新增 `merchant_application` 表和 `tenant.source` 列 |
| 管理后台菜单 | MainLayout 侧边栏新增「入驻审核」 |
| 管理后台路由 | routes/index.tsx 新增审核页路由 |
