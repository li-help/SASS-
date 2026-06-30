# 前后端联调 + WebSocket 实时刷新 设计文档

> 日期：2026-06-30 | 状态：待实施

## 1. 背景与目标

### 背景
当前平台已支持用户自主注册、管理员创建用户、商家入驻审核三条用户创建路径。但各管理页面之间缺乏实时数据同步：一个管理员创建/修改了资源，其他管理员无法感知，必须手动刷新页面。

### 目标
1. **前后端联调**：确保注册用户正确出现在用户管理页面（按租户隔离）
2. **实时刷新**：所有管理页面通过 WebSocket 接收数据变更通知，自动刷新

---

## 2. 架构设计

```
┌─────────────────────────────────────────────────┐
│                    Frontend                      │
│  React Query (Cache) ←── STOMP Client ────┐     │
│  useRealtimeRefresh() hook                 │     │
│  Pages (auto invalidate query cache)       │     │
└─────────────────────────────────────────────┼────┘
                                              │
                                WebSocket /ws │ STOMP over SockJS
                                              │
┌─────────────────────────────────────────────┼────┐
│                   Backend                    │    │
│  Controllers ──→ Services ──→ DB            │    │
│       │                                      │    │
│       └──→ EventPublisher ──→ STOMP Broker ──┘    │
│  /api/*  REST (JWT auth)                           │
│  /ws     WebSocket (JWT via handshake interceptor)│
└───────────────────────────────────────────────────┘
```

### 原则
- REST 负责 CRUD，WebSocket 仅用于变更通知（不传业务数据）
- 前端收到通知后通过 React Query 自动重新请求最新数据
- WebSocket 连接使用与 REST 相同的 JWT 认证机制

---

## 3. 后端变更

### 3.1 新增依赖

`sass-kb-server/pom.xml`：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### 3.2 新增 WebSocketConfig

**文件：** `sass-kb-web/src/main/java/com/sass/kb/config/WebSocketConfig.java`

- 启用 STOMP 消息代理 (`@EnableWebSocketMessageBroker`)
- 内存消息代理 (`/topic` 前缀，客户端订阅地址)
- 应用消息前缀 `/app`（预留给将来服务端接收消息）
- STOMP 端点 `/ws`，允许 SockJS 降级
- 允许所有来源的跨域连接

### 3.3 新增 WebSocketHandshakeInterceptor

**文件：** `sass-kb-web/src/main/java/com/sass/kb/config/WebSocketHandshakeInterceptor.java`

- 在 WebSocket 握手阶段读取请求参数中的 `token`
- 使用 `JwtUtil` 验证 JWT，提取 `userId` 和 `tenantId`
- 验证通过后设置握手属性，允许连接建立
- 验证失败返回 401，拒绝连接

### 3.4 新增 EntityEvent

**文件：** `sass-kb-common/src/main/java/com/sass/kb/common/event/EntityEvent.java`

```java
public class EntityEvent {
    String type;        // CREATED | UPDATED | DELETED | STATUS_CHANGED
    String entityType;  // USER | TENANT | SPACE | DOC | FILE | ROLE
    String entityId;    // 实体ID
    String tenantId;    // 所属租户
    long timestamp;     // 事件时间戳
}
```

### 3.5 新增 EventPublisher

**文件：** `sass-kb-common/src/main/java/com/sass/kb/common/event/EventPublisher.java`

- 注入 `SimpMessagingTemplate`
- `publish(EntityEvent)` 方法 → 发送到 `/topic/entity-changes`
- 使用 `@Async` 异步执行，不阻塞业务线程

### 3.6 改造 Controller 写操作

在以下 Controller 的写操作（create/update/delete/toggleStatus）完成后调用 `eventPublisher.publish()`：

| Controller | 方法 | 事件 entityType |
|------------|------|----------------|
| `AuthController` | `register()` | USER |
| `UserController` | `create()`, `update()`, `toggleStatus()`, `resetPassword()` | USER |
| `TenantController` | `create()`, `update()`, `toggleStatus()`, `delete()` | TENANT |
| `SpaceController` | `create()`, `update()`, `delete()` | SPACE |
| `DocController` | `create()`, `save()`, `updateStatus()`, `delete()` | DOC |
| `FileController` | `upload()`, `delete()` | FILE |
| `RoleController` | `create()`, `update()`, `delete()`, `assign()` | ROLE |
| `OnboardingController` | `approve()`, `reject()` | USER, TENANT |

### 3.7 改造 WebMvcConfig

在 `WebMvcConfig.addInterceptors()` 中放行 WebSocket 端点：

```java
.excludePathPatterns("/ws/**", "/ws")
```

### 3.8 添加 @EnableAsync

在 `KbApplication` 上添加 `@EnableAsync` 注解，确保 `EventPublisher` 异步发送正常运作。

---

## 4. 前端变更

### 4.1 新增依赖

`sass-kb-admin/package.json`：
```json
{
    "@stomp/stompjs": "^7.0.0",
    "sockjs-client": "^1.6.1"
}
```

### 4.2 新增 useStomp Hook

**文件：** `src/hooks/useStomp.ts`

- 从 `authStore` 读取 `accessToken`
- 创建 STOMP Client，连接 `/ws`，携带 token 参数
- 支持自动重连（指数退避，最大 30s 间隔）
- 心跳检测 (10s 发送，10s 接收)
- 提供 `subscribe(destination, callback)` 和 `connected` 状态

### 4.3 新增 useRealtimeRefresh Hook

**文件：** `src/hooks/useRealtimeRefresh.ts`

- 使用 `useStomp` 获取 STOMP 连接
- 订阅 `/topic/entity-changes`
- 事件类型到 React Query key 的映射：

```typescript
const KEY_MAP: Record<string, string[][]> = {
    USER:   [['users'], ['dashboard-stats']],
    TENANT: [['tenants'], ['dashboard-stats']],
    SPACE:  [['spaces'], ['dashboard-stats']],
    DOC:    [['doc'], ['space-tree'], ['folder-docs'], ['dashboard-stats']],
    FILE:   [['files'], ['dashboard-stats']],
    ROLE:   [['roles']],
};
```

- 收到事件 → 遍历对应 queryKeys → `queryClient.invalidateQueries({ queryKey, exact: false })`
- 300ms debounce，合并短时间内多个同类事件

### 4.4 MainLayout 改动

在 `MainLayout.tsx` 中挂载 `useRealtimeRefresh()` hook，使整个后台布局内的页面都获得实时刷新能力。

### 4.5 页面自动刷新覆盖清单

| 页面 | 变更来源 | 刷新方式 |
|------|---------|---------|
| 工作台 Dashboard | 保留 `refetchInterval: 30s` + WebSocket 即时刷新 | 统计数据自动更新 |
| 用户管理 User | WebSocket USER 事件 | 列表自动刷新 |
| 租户管理 Tenant | WebSocket TENANT 事件 | 列表自动刷新 |
| 知识空间 Space | WebSocket SPACE 事件 | 卡片列表自动刷新 |
| 文件管理 File | WebSocket FILE 事件 | 列表自动刷新 |
| 角色权限 Role | WebSocket ROLE 事件 | 列表自动刷新 |
| 审计日志 Audit | 无需实时刷新（历史数据） | 不变 |
| 入驻审核 Onboarding | 本地 mutation 后 invalidate | 保持不变 |

---

## 5. 认证流程

### WebSocket 连接认证

1. 前端：从 `authStore` 获取 accessToken
2. 前端：STOMP 连接 `ws://host/ws?token=xxx`
3. 后端：`WebSocketHandshakeInterceptor` 验证 JWT
4. 认证通过 → 连接建立，订阅 `/topic/entity-changes`
5. Token 过期 → 前端 token 刷新机制自动更新，STOMP 重新连接

### Token 过期处理

- accessToken 过期时，REST API 的 401 拦截器会自动刷新
- STOMP 连接断开时，`useStomp` 自动重连，使用最新 token
- 重连前检查 `authStore.accessToken` 是否已更新

---

## 6. 错误处理

| 场景 | 前端处理 |
|------|---------|
| WebSocket 连接失败 | 控制台日志，不影响 REST API 正常使用 |
| 连接断开 | 自动重连（指数退避 1s/2s/4s/8s/16s/30s）|
| 收到无效事件 | 静默忽略 |
| token 过期导致断开 | 重连时使用刷新后的 token |
| 页面切换到登录页 | `useStomp` 检测到无 token，断开连接 |

---

## 7. 文件清单

### 后端新增

```
sass-kb-web/src/main/java/com/sass/kb/config/WebSocketConfig.java
sass-kb-web/src/main/java/com/sass/kb/config/WebSocketHandshakeInterceptor.java
sass-kb-common/src/main/java/com/sass/kb/common/event/EntityEvent.java
sass-kb-common/src/main/java/com/sass/kb/common/event/EventPublisher.java
```

### 后端修改

```
sass-kb-server/pom.xml                                  # 添加 websocket 依赖
sass-kb-web/src/main/java/com/sass/kb/config/WebMvcConfig.java  # 放行 /ws
sass-kb-web/src/main/java/com/sass/kb/KbApplication.java        # 添加 @EnableAsync
sass-kb-auth/.../controller/AuthController.java                 # register 发布事件
sass-kb-auth/.../controller/UserController.java                 # 写操作发布事件
sass-kb-tenant/.../controller/TenantController.java             # 写操作发布事件
sass-kb-doc/.../controller/SpaceController.java                 # 写操作发布事件
sass-kb-doc/.../controller/DocController.java                   # 写操作发布事件
sass-kb-file/.../controller/FileController.java                 # 写操作发布事件
sass-kb-auth/.../controller/RoleController.java                 # 写操作发布事件
sass-kb-onboarding/.../controller/OnboardingController.java     # approve/reject 发布事件
```

### 前端新增

```
src/hooks/useStomp.ts
src/hooks/useRealtimeRefresh.ts
```

### 前端修改

```
package.json                     # 添加依赖
src/layouts/MainLayout.tsx       # 挂载 useRealtimeRefresh
```

---

## 8. 用户注册到用户管理完整链路

```
用户操作                  后端                             前端
─────────               ──────                           ──────
POST /api/auth/register → AuthService.register()
                           ├─ 创建 Tenant（如有 companyName）
                           ├─ 创建 User
                           └─ EventPublisher.publish(USER, CREATED)
                                  ↓
                         STOMP → /topic/entity-changes
                                                              ↓
                                              useRealtimeRefresh 接收事件
                                                              ↓
                                              queryClient.invalidateQueries(['users'])
                                                              ↓
                                              UserPage 自动重新请求 GET /api/user/list
                                                              ↓
                                              新用户出现在列表中 ✓
```

---

## 9. 测试验证

### 后端测试
- WebSocket 端点 `/ws` 可连接
- JWT 认证握手成功/失败
- 各 Controller 写操作后 `/topic/entity-changes` 收到正确事件

### 前端测试
- STOMP 连接成功，自动重连正常
- 在一个浏览器标签页注册用户/创建空间
- 在另一个标签页观察对应列表自动刷新
- 连接断开后页面仍然可用（降级到手动刷新）
