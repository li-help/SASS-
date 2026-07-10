# 统一认证微服务 — 使用文档

**日期：** 2026-07-10
**版本：** v1.0

---

## 1. 概述

统一认证微服务 (`taoyue-auth`) 将原 SASS 知识平台的认证授权模块独立为 Spring Cloud 微服务，实现以下能力：

- **共享用户体系** — SASS KB 和 taoyue-edu 共用同一套账号登录
- **统一入口** — 所有请求通过 `taoyue-gateway` 进入，JWT 在网关层全局验签
- **向后兼容** — 前端无需改动，`/api/**` 路径由 Gateway 自动 strip prefix 后转发

---

## 2. 服务拓扑

```
                    ┌─────────────────────────┐
  前端 :80  ──────→ │   taoyue-gateway :8080  │
                    │   (Spring Cloud Gateway) │
                    │   + AuthGlobalFilter     │
                    └───┬──────┬──────┬────────┘
                        │      │      │
           ┌────────────┘      │      └──────────────┐
           ▼                   ▼                      ▼
  ┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐
  │ taoyue-auth     │ │ taoyue-*     │ │ sass-kb-backend  │
  │ :8081 (Nacos)   │ │ (Nacos)      │ │ :8080 (直连)     │
  │                 │ │              │ │                  │
  │ 登录 注册 刷新   │ │ 系统 课程     │ │ 文档 文件 搜索    │
  │ 用户 角色 菜单   │ │ 统计         │ │ 协作 通知 入驻    │
  │ 权限 审计       │ │              │ │                  │
  └────────┬────────┘ └──────────────┘ └──────────────────┘
           │
  ┌────────▼────────┐
  │   PostgreSQL    │   user / role / menu / permission_rule / tenant / audit_log
  │   Redis         │   权限缓存 + 缓存失效广播
  │   Nacos :8849   │   服务注册 & 配置中心
  └─────────────────┘
```

---

## 3. 快速开始（本地开发）

### 3.1 前置条件

- JDK 17+
- Docker Desktop（或本地装 PostgreSQL、Redis、Nacos）
- Maven 3.9+

### 3.2 启动基础设施

```bash
# 在项目根目录
docker compose up -d postgres redis
```

### 3.3 启动 Nacos

```bash
docker run -d --name nacos -p 8849:8849 -p 9848:9848 \
  -e MODE=standalone nacos/nacos-server:v2.3.0
```

### 3.4 启动 taoyue-auth

```bash
cd taoyue-edu-server/taoyue-auth

# 设置环境变量（或使用默认值）
export JWT_SECRET=my-dev-secret-key-at-least-32-chars
export DB_PASSWORD=postgres

mvn spring-boot:run
# 启动在 http://localhost:8081
```

### 3.5 启动 taoyue-gateway

```bash
cd taoyue-edu-server/taoyue-gateway

export JWT_SECRET=my-dev-secret-key-at-least-32-chars

mvn spring-boot:run
# 启动在 http://localhost:8080
```

### 3.6 启动 SASS KB Backend

```bash
cd sass-kb-server

mvn spring-boot:run -pl sass-kb-web
# 启动在 http://localhost:8080（内部端口，通过 Gateway 访问）
```

### 3.7 验证

```bash
# 1. 注册用户
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123","realName":"演示用户"}'

# 2. 登录
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"demo","password":"demo123"}'

# 返回: {"code":200,"data":{"accessToken":"eyJ...","refreshToken":"eyJ...",...}}

# 3. 用 token 访问受保护接口
curl http://localhost:8080/user/me \
  -H "Authorization: Bearer <accessToken>"

# 4. 刷新 token
curl -X POST http://localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

---

## 4. API 文档

所有接口通过 Gateway 统一入口 `http://localhost:8080` 访问。

Swagger 文档：`http://localhost:8080/doc.html`

### 4.1 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/login` | 用户登录 | 白名单 |
| POST | `/auth/register` | 用户注册 | 白名单 |
| POST | `/auth/refresh` | 刷新 Token | 白名单 |
| POST | `/auth/verify` | 验证 Token（服务间调用） | 内部 |

### 4.2 用户接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/user/list` | 用户列表（分页） | 登录 |
| POST | `/user` | 创建用户 | system:user:add |
| PUT | `/user/{id}` | 更新用户信息 | system:user:edit |
| PUT | `/user/{id}/status` | 启用/禁用用户 | system:user:edit |
| PUT | `/user/{id}/password` | 重置密码 | system:user:edit |
| GET | `/user/me` | 获取当前用户信息 | 登录 |
| GET | `/user/me/roles` | 获取当前用户角色 | 登录 |
| PUT | `/user/me/update` | 修改个人信息/密码 | 登录 |

### 4.3 角色接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/role/list` | 角色列表（分页） | 登录 |
| POST | `/role` | 创建角色 | system:role:add |
| PUT | `/role/{id}` | 更新角色 | system:role:edit |
| DELETE | `/role/{id}` | 删除角色 | system:role:delete |
| POST | `/role/{id}/assign` | 分配用户到角色 | system:role:assign |
| GET | `/role/{id}/members` | 获取角色成员列表 | 登录 |
| DELETE | `/role/{id}/members/{userId}` | 移除角色成员 | system:role:assign |
| POST | `/role/init-defaults` | 初始化默认角色 | 登录 |

### 4.4 菜单接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/menu/tree` | 获取菜单树 | 登录 |
| GET | `/menu/list` | 菜单列表 | 登录 |
| POST | `/menu` | 创建菜单 | system:menu:add |
| PUT | `/menu/{id}` | 更新菜单 | system:menu:edit |
| DELETE | `/menu/{id}` | 删除菜单（级联） | system:menu:delete |
| POST | `/menu/init-defaults` | 初始化默认菜单 | 登录 |

### 4.5 权限接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/permission/rules` | 权限规则列表 | 登录 |
| POST | `/permission/rules` | 创建权限规则 | 管理 |
| PUT | `/permission/rules/{id}` | 更新权限规则 | 管理 |
| DELETE | `/permission/rules/{id}` | 删除权限规则 | 管理 |
| POST | `/permission/rules/batch` | 批量创建权限规则 | 管理 |
| DELETE | `/permission/rules/batch` | 批量删除权限规则 | 管理 |
| GET | `/permission/check` | 检查操作权限 | 登录 |

### 4.6 审计接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/audit/list` | 审计日志列表（分页） | 登录 |

### 4.7 向后兼容路径

前端继续使用 `/api/**` 前缀，Gateway 自动 strip `/api` 后转发到对应服务：

| 前端路径 | 实际转发 |
|----------|---------|
| `/api/auth/login` | → `taoyue-auth` `/auth/login` |
| `/api/user/list` | → `taoyue-auth` `/user/list` |
| `/api/doc/list` | → `sass-kb-backend` `/doc/list` |
| `/api/file/upload` | → `sass-kb-backend` `/file/upload` |

---

## 5. JWT 说明

### 5.1 Token 结构

**Access Token（访问令牌）：**
```json
{
  "sub": "user-uuid",
  "tenantId": "tenant-uuid",
  "type": "access",
  "jti": "random-uuid",
  "iat": 1720000000,
  "exp": 1720001800
}
```
- 默认有效期：**30 分钟**
- 用于 API 请求的 Authorization Header

**Refresh Token（刷新令牌）：**
```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "jti": "random-uuid",
  "iat": 1720000000,
  "exp": 1720604800
}
```
- 默认有效期：**7 天（10080 分钟）**
- 仅用于 `/auth/refresh` 换取新 access token

### 5.2 使用方式

```
Authorization: Bearer <access-token>
```

### 5.3 密钥配置

所有服务和 Gateway 必须使用相同的 `JWT_SECRET`：

```yaml
# taoyue-auth / taoyue-gateway 共用
jwt:
  secret: ${JWT_SECRET}
```

### 5.4 Gateway Header 透传

Gateway 验证 JWT 后，向下游透传以下 Header：

| Header | 值 | 说明 |
|--------|-----|------|
| `X-User-Id` | 用户 UUID | 业务服务从 request 读取 |
| `X-Tenant-Id` | 租户 UUID | 多租户隔离依据 |

---

## 6. 配置说明

### 6.1 必需环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `JWT_SECRET` | JWT 签名密钥（≥32字符） | `change-me-to-a-random-string` |
| `DB_PASSWORD` | PostgreSQL 密码 | `postgres` |
| `NACOS_SERVER_ADDR` | Nacos 地址 | `nacos:8849` |

### 6.2 taoyue-auth 配置项

```yaml
jwt:
  secret: ${JWT_SECRET}
  access-token-expire: 30        # access token 有效期（分钟）
  refresh-token-expire: 10080    # refresh token 有效期（分钟）

spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/sass_kb
  data:
    redis:
      host: redis
      port: 6379
```

### 6.3 跳过种子数据初始化

```yaml
# 设置后不自动创建默认角色/菜单/管理员
app:
  skip-init-defaults: true
```

---

## 7. 权限模型

### 7.1 RBAC + ACL

```
User ──(member)──→ Role ──(permissions)──→ Resource
  │                                            │
  └────(allow/deny)────────────────────────────┘
                (直接 ACL 规则)
```

### 7.2 默认角色

系统通过 `SystemDataInitializer` 自动为每个租户创建三种默认角色：

| 角色 | 权限 | 说明 |
|------|------|------|
| 管理员 | `*:*` | 拥有所有权限 |
| 普通用户 | `space:read, doc:read, doc:write, file:read, file:write` | 可编辑内容、读写文件 |
| 访客 | `space:read, doc:read, file:read` | 仅可读取 |

### 7.3 权限格式

```
<资源类型>:<操作>
例：doc:read, file:write, space:admin
通配符：*:* (全部)
```

### 7.4 权限检查优先级

1. **Deny 优先** — 任何层级的显式拒绝立即生效
2. **用户 ACL** — 直接授予用户的 allow 规则
3. **角色权限** — 通过角色继承（含父角色递归）
4. **默认拒绝** — 以上都不匹配则拒绝

### 7.5 超管绕过

`isSuperAdmin=true` 的用户跳过所有权限检查。

---

## 8. 缓存策略

### 8.1 两级缓存

```
请求 → Caffeine (本地, 5min TTL) → Redis → DB
         ↓ miss
       Redis 查询
         ↓ miss
       PostgreSQL 查询
```

### 8.2 缓存失效

- **本地失效** — 调用 `PermissionService.invalidateCache()` 清空本地 Caffeine
- **集群广播** — 调用 `broadcastInvalidation()` 通过 Redis Pub/Sub 通知所有实例
- **频道** — `perm:invalidate`
- **消息格式** — `{tenantId}:{resourceType}:{resourceId}`

---

## 9. Gateway 白名单

以下路径无需认证：

```
/auth/login
/auth/register
/auth/refresh
/v3/api-docs/**
/doc.html
/webjars/**
/swagger-resources/**
/swagger-ui/**
OPTIONS 预检请求
```

新增白名单路径请修改 `AuthGlobalFilter.WHITELIST`。

---

## 10. 部署

### 10.1 Docker Compose（推荐）

```bash
# 在项目根目录
cp .env.example .env
# 编辑 .env 填入实际值

docker compose -f docker-compose.prod.yml up -d
```

启动顺序：`postgres → nacos → taoyue-auth → gateway → backend → frontend`

### 10.2 CI/CD 流水线

```
docker-backend → docker-auth → docker-gateway → docker-frontend → deploy
```

新服务镜像：
- `$CI_REGISTRY_IMAGE/taoyue-auth:latest`
- `$CI_REGISTRY_IMAGE/taoyue-gateway:latest`

### 10.3 端口规划

| 服务 | 端口 | 对外 | 说明 |
|------|------|------|------|
| gateway | 80 | ✓ | 统一入口 |
| frontend | 8082 | ✗ | 静态资源 |
| taoyue-auth | 8081 | ✗ | 认证服务 |
| backend | 8080 | ✗ | SASS KB 业务 |
| nacos | 8849 | ✗ | 注册/配置中心 |
| postgres | 5432 | ✗ | 数据库 |
| redis | 6379 | ✗ | 缓存 |

---

## 11. 故障排查

### 11.1 登录返回 502

- 检查 `taoyue-auth` 是否启动且健康：`curl http://localhost:8081/actuator/health`
- 检查 Nacos 是否正常：`curl http://localhost:8849/nacos/v1/console/health/readiness`
- Gateway 日志查看路由是否正确解析

### 11.2 Token 始终返回 401

- 确认 Gateway 和 taoyue-auth 的 `JWT_SECRET` 一致
- 确认 access token 未过期（默认 30 分钟）
- 确认请求头格式：`Authorization: Bearer <token>`
- 确认请求的 access token（不是 refresh token）

### 11.3 权限检查不生效

- 确认用户已分配角色
- 检查 `permission_rule` 表中有对应的 allow 规则
- 调用 `/permission/check` 接口验证具体权限
- 检查是否命中了 deny 规则（deny 优先）

### 11.4 缓存不一致

- 手动调 `/role/{id}` PUT 会触发 `broadcastInvalidation`
- 或重启 taoyue-auth 清空所有缓存
- Redis 中 `perm:invalidate` 频道确保集群一致性

---

## 12. 项目文件索引

```
taoyue-edu-server/
├── taoyue-auth/                     # 统一认证服务
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/zhentao/auth/
│       ├── AuthApplication.java
│       ├── config/                  # JwtProperties, JsonbTypeHandler, WebMvcConfig, SystemDataInitializer
│       ├── controller/              # Auth, User, Role, Menu, Permission, AuditLog
│       ├── service/                 # AuthService, RoleService, MenuService, PermissionService
│       ├── entity/                  # User, Role, Menu, PermissionRule, Tenant
│       ├── mapper/                  # MyBatis-Plus Mapper
│       ├── dto/                     # Request/Response DTO
│       ├── util/                    # JwtUtil
│       ├── aspect/                  # PermissionAspect, AuditAspect
│       ├── interceptor/             # AuthInterceptor
│       ├── cache/                   # PermissionCacheInvalidator
│       └── listener/                # AuditEventListener
│
├── taoyue-gateway/                  # API 网关
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/taoyue/gateway/
│       ├── GatewayApplication.java
│       └── filter/
│           └── AuthGlobalFilter.java # JWT 验签 + Header 透传
│
└── taoyue-common/                   # 公共模块
    └── src/main/java/com/zhentao/common/
        ├── annotation/              # @AuditLog, @RequirePermission
        ├── context/                 # TenantContext
        ├── entity/                  # AuditLog
        ├── event/                   # EntityEvent, EventPublisher
        ├── exception/               # BizException, GlobalExceptionHandler
        ├── handler/                 # StringArrayTypeHandler
        ├── mapper/                  # AuditLogMapper
        ├── permission/              # ResourceParentResolver
        └── result/                  # R, PageResult
```
