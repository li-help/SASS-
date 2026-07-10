# 统一认证微服务 — 系统设计文档

**日期：** 2026-07-10
**版本：** v1.0
**状态：** 待 Review

---

## 1. 背景与目标

### 1.1 现状

当前项目包含两个后端系统：

| | SASS 知识平台 (`sass-kb-server`) | taoyue-edu (`taoyue-edu-server`) |
|---|---|---|
| 架构 | Spring Boot 3.2 模块化单体 | Spring Cloud 2023.0.1 微服务 |
| 认证 | `sass-kb-auth` 模块（功能完整） | `taoyue-auth` 服务（空壳，仅假登录） |
| 用户体系 | 独立 | 无 |
| 基础设施 | PG, ES, MinIO, Redis, RabbitMQ | Nacos, Sentinel, Gateway |

### 1.2 目标

将 `taoyue-auth` 升级为**统一认证中心**，实现：

- SASS KB 和 taoyue-edu **共享用户体系**，同一账号登录两个系统（SSO）
- `sass-kb-auth` 全部业务逻辑迁入 `taoyue-auth`，SASS KB 通过 REST API 调用认证服务
- 所有服务通过 `taoyue-gateway` 统一入口，JWT 全局验签

---

## 2. 目标架构

```
                          ┌──────────────────────────┐
                          │   taoyue-gateway :8080    │
                          │   (Spring Cloud Gateway)  │
                          │   + 全局 JWT 验签 Filter   │
                          │   + Knife4j 聚合文档       │
                          └───┬───────┬──────┬────────┘
                              │       │      │
              ┌───────────────┘       │      └──────────────┐
              ▼                       ▼                      ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │  taoyue-auth     │  │  taoyue-system   │  │  SASS KB backend │
   │  :8081           │  │  :8082           │  │  :8080           │
   │                  │  │  (taoyue 业务)    │  │  (Spring Boot    │
   │  ★ 统一认证中心   │  │                  │  │   去掉 auth 模块) │
   │                  │  └──────────────────┘  │                  │
   │  登录/注册/刷新   │                       │  doc / file /    │
   │  用户/角色/菜单   │  ┌──────────────────┐  │  search / collab │
   │  权限/审计       │  │  taoyue-course   │  │  notification /  │
   │  JWT 签发/校验   │  │  :8083           │  │  onboarding      │
   └──────┬───────────┘  └──────────────────┘  └──────┬───────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │    PostgreSQL     │
                   │  (共享库 sass_kb) │
                   │  user / role /    │
                   │  menu / tenant /  │
                   │  permission_rule  │
                   └───────────────────┘
```

### 请求链路

```
前端 → Gateway :8080 → [AuthFilter 验 JWT] → 下游服务

Gateway AuthFilter 职责：
  1. 从 Authorization Header 提取 Bearer token
  2. 调用 taoyue-auth /auth/verify 验证（或本地 JWT 验签）
  3. 将 userId、tenantId、roles 写入 X-User-Id、X-Tenant-Id、X-Roles Header
  4. 转发给下游服务（SASS KB / taoyue-system / taoyue-course ...）
```

---

## 3. 迁移范围

### 3.1 迁入 taoyue-auth 的模块（从 sass-kb-auth）

```
sass-kb-auth (31 个文件)              →  taoyue-auth (目标)
───────────────────────────────────────────────────────────
controller/
  AuthController.java                 →  登录/注册/刷新 Token
  UserController.java                 →  用户 CRUD
  RoleController.java                 →  角色 CRUD
  MenuController.java                 →  菜单 CRUD
  PermissionController.java           →  权限规则管理
  AuditLogController.java            →  审计日志查询

service/
  AuthService.java                    →  BCrypt 验密 + JWT 签发
  RoleService.java                    →  角色管理 + 默认角色初始化
  MenuService.java                    →  菜单树管理
  PermissionService.java              →  权限校验逻辑

entity/ + mapper/
  User / Role / Menu / PermissionRule →  4 张核心表
  UserMapper / RoleMapper / ...       →  MyBatis-Plus Mapper

infra/
  JwtUtil + JwtProperties             →  JWT 签发/校验
  AuthInterceptor                     →  HTTP 拦截器（taoyue-auth 内部使用）
  PermissionAspect                    →  AOP 权限切面
  AuditAspect + AuditEventListener    →  审计切面
  PermissionCacheInvalidator          →  Redis + Caffeine 两级缓存
  SystemDataInitializer               →  种子数据初始化
```

### 3.2 从 sass-kb-tenant 迁入

| 文件 | 说明 |
|------|------|
| `Tenant.java` | 租户实体，多租户体系的根基 |
| `TenantMapper.java` | 租户 Mapper |
| `TenantContext.java` | ThreadLocal 租户上下文 |

### 3.3 taoyue-common 补充

| 文件 | 说明 |
|------|------|
| `BizException.java` | 业务异常类（迁自 sass-kb-common） |
| `TenantContext.java` | ThreadLocal 租户上下文（迁自 sass-kb-tenant） |

### 3.4 SASS KB 保留不变

- `sass-kb-doc` / `sass-kb-file` / `sass-kb-search` / `sass-kb-collaboration` / `sass-kb-notification` / `sass-kb-onboarding` — 业务逻辑不动
- 原来通过 `AuthInterceptor` 做认证、`PermissionAspect` 做鉴权 → 改为调用 `taoyue-auth` REST API

---

## 4. taoyue-auth 新结构

```
taoyue-auth/
├── pom.xml                          # 新增依赖
│   # MyBatis-Plus, PostgreSQL, jjwt, Redis, Caffeine,
│   # Hutool (BCrypt), Spring Boot AOP
└── src/main/
    ├── java/com/zhentao/auth/
    │   ├── AuthApplication.java      # @MapperScan, @EnableCaching,
    │   │                             # @EnableAsync, @EnableAspectJAutoProxy
    │   │
    │   ├── config/
    │   │   ├── JwtProperties.java    # @ConfigurationProperties(prefix="jwt")
    │   │   ├── JsonbTypeHandler.java # PG jsonb 类型处理器
    │   │   ├── SystemDataInitializer.java  # CommandLineRunner 种子数据
    │   │   └── WebMvcConfig.java     # 注册 AuthInterceptor + CORS
    │   │
    │   ├── controller/
    │   │   ├── AuthController.java        # /auth/login, /auth/register,
    │   │   │                               # /auth/refresh, /auth/verify
    │   │   ├── UserController.java        # /users/**
    │   │   ├── RoleController.java        # /roles/**
    │   │   ├── MenuController.java        # /menus/**
    │   │   ├── PermissionController.java  # /permissions/**
    │   │   └── AuditLogController.java    # /audit-logs/**
    │   │
    │   ├── service/
    │   │   ├── AuthService.java
    │   │   ├── RoleService.java
    │   │   ├── MenuService.java
    │   │   └── PermissionService.java
    │   │
    │   ├── entity/
    │   │   ├── User.java
    │   │   ├── Role.java
    │   │   ├── Menu.java
    │   │   ├── PermissionRule.java
    │   │   ├── Tenant.java           # 从 sass-kb-tenant 迁入
    │   │   └── AuditLog.java
    │   │
    │   ├── mapper/
    │   │   ├── UserMapper.java
    │   │   ├── RoleMapper.java
    │   │   ├── MenuMapper.java
    │   │   ├── PermissionRuleMapper.java
    │   │   └── TenantMapper.java
    │   │
    │   ├── dto/
    │   │   ├── LoginRequest.java
    │   │   ├── RefreshRequest.java
    │   │   ├── RegisterRequest.java
    │   │   └── TokenResponse.java
    │   │
    │   ├── aspect/
    │   │   ├── PermissionAspect.java
    │   │   └── AuditAspect.java
    │   │
    │   ├── interceptor/
    │   │   └── AuthInterceptor.java  # taoyue-auth 内部认证
    │   │
    │   ├── cache/
    │   │   └── PermissionCacheInvalidator.java
    │   │
    │   ├── util/
    │   │   └── JwtUtil.java
    │   │
    │   └── listener/
    │       └── AuditEventListener.java
    │
    └── resources/
        ├── application.yml
        └── db/migration/            # Flyway 迁移脚本
            └── V1__init_auth_tables.sql
```

### 4.1 新增内部 API（供其他服务调用）

| 接口 | 方法 | 用途 | 鉴权 |
|------|------|------|------|
| `/auth/verify` | POST | 验证 JWT 有效，返回 `{userId, tenantId, roles}` | 服务间内部调用 |
| `/auth/permissions/{userId}` | GET | 查询用户全部权限规则 | 服务间内部调用 |
| `/auth/check` | POST | 检查用户是否有指定操作权限 `{userId, action, resource}` | 服务间内部调用 |

### 4.2 taoyue-auth application.yml

```yaml
server:
  port: 8081

spring:
  application:
    name: taoyue-auth
  datasource:
    url: jdbc:postgresql://postgres:5432/sass_kb
    username: postgres
    password: ${DB_PASSWORD}
  data:
    redis:
      host: redis
      port: 6379
  config:
    import: optional:nacos:${spring.application.name}.yaml
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8849
      config:
        server-addr: 127.0.0.1:8849
        file-extension: yaml

jwt:
  secret: ${JWT_SECRET}
  access-token-expire: 30
  refresh-token-expire: 10080

mybatis-plus:
  mapper-locations: classpath*:/mapper/**/*.xml
  global-config:
    db-config:
      id-type: assign_id
```

---

## 5. 数据库策略

### 5.1 原则

**不拆库，只移交管理权。** taoyue-auth 和 SASS KB 继续共用同一个 PostgreSQL 数据库 `sass_kb`。

### 5.2 表归属

| 表 | 管理者 | 说明 |
|----|--------|------|
| `sys_user` | taoyue-auth | 用户表，独占写权限 |
| `sys_role` | taoyue-auth | 角色表，独占写权限 |
| `sys_menu` | taoyue-auth | 菜单表，独占写权限 |
| `permission_rule` | taoyue-auth | 权限规则表，独占写权限 |
| `sys_tenant` | taoyue-auth | 租户表，独占写权限 |
| `audit_log` | taoyue-auth | 审计日志表，独占写权限 |
| `document` | SASS KB | 文档表 |
| `document_version` | SASS KB | 文档版本表 |
| `file_metadata` | SASS KB | 文件元数据表 |
| `notification` | SASS KB | 通知表 |
| `comment` | SASS KB | 评论表 |
| `onboarding_*` | SASS KB | 引导配置表 |

### 5.3 Flyway 协调

taoyue-auth 和 SASS KB 共用同一张 `flyway_schema_history` 表。约定版本号前缀：

- `V1__` ~ `V9__` — SASS KB 已有迁移（不动）
- `V10__` 起，新脚本按归属方协调版本号，避免冲突

---

## 6. SASS KB 改动

### 6.1 删除

```
sass-kb-server/
├── pom.xml                          # 移除 <module>sass-kb-auth</module>
└── sass-kb-auth/                    # 整个模块删除
```

### 6.2 修改

**sass-kb-web/pom.xml：**

```xml
<!-- 移除 -->
<dependency>
    <groupId>com.sass.kb</groupId>
    <artifactId>sass-kb-auth</artifactId>
</dependency>

<!-- 新增：服务间 HTTP 调用 -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

**新建 AuthClient：**

```java
// sass-kb-web 或 sass-kb-common
@Component
public class AuthClient {

    private final RestClient restClient;  // 或 WebClient

    // POST /auth/verify → {userId, tenantId, username, roles}
    public VerifyResult verify(String token);

    // GET /auth/permissions/{userId} → List<PermissionRule>
    public List<PermissionRule> getPermissions(String userId);

    // POST /auth/check → {allowed: true/false}
    public boolean checkPermission(String userId, String action, String resource);
}
```

**WebMvcConfig 改造：**

```java
// 原来：注册 AuthInterceptor（本地查 DB 验 JWT）
// 改为：注册 GatewayHeaderFilter（从 X-User-Id / X-Tenant-Id Header
//       读取身份信息，这些值已由 Gateway AuthFilter 验签后注入）
```

### 6.3 受影响逻辑的替换

| 位置 | 原来 | 改后 |
|------|------|------|
| AuthInterceptor | 本地查 DB 验 JWT + 查 User 状态 | 信任 Gateway 传入的 X-User-Id Header |
| PermissionAspect | 本地查 PermissionRule 表 | 调用 `AuthClient.checkPermission()` |
| AuditAspect | 本地写审计日志 | 调用 `AuthClient.audit()` 或发 RabbitMQ 消息 |
| controllers 中 `request.getAttribute("userId")` | 从 Interceptor 注入 | 从 X-User-Id Header 读取 |

---

## 7. Gateway 配置

### 7.1 新增 AuthFilter

```java
@Component
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    // 白名单路径（无需认证）
    private static final List<String> WHITELIST = List.of(
        "/auth/login", "/auth/register", "/auth/refresh",
        "/v3/api-docs", "/doc.html", "/webjars/**"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (isWhitelist(exchange.getRequest().getPath().toString())) {
            return chain.filter(exchange);
        }

        String token = extractToken(exchange.getRequest());
        if (token == null) {
            return unauthorized(exchange, "未登录");
        }

        // 本地 JWT 验签（无需网络调用，高性能）
        try {
            Claims claims = jwtUtil.validateToken(token);
            ServerHttpRequest mutated = exchange.getRequest().mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-Tenant-Id", claims.get("tenantId", String.class))
                .build();
            return chain.filter(exchange.mutate().request(mutated).build());
        } catch (Exception e) {
            return unauthorized(exchange, "令牌无效或已过期");
        }
    }
}
```

### 7.2 路由配置

```yaml
spring:
  cloud:
    gateway:
      routes:
        # taoyue 认证服务
        - id: taoyue-auth
          uri: lb://taoyue-auth
          predicates:
            - Path=/auth/**, /users/**, /roles/**, /menus/**, /permissions/**

        # taoyue 系统管理
        - id: taoyue-system
          uri: lb://taoyue-system
          predicates:
            - Path=/system/**

        # taoyue 课程服务
        - id: taoyue-course
          uri: lb://taoyue-course
          predicates:
            - Path=/course/**

        # SASS KB 后端
        - id: sass-kb-backend
          uri: lb://sass-kb-backend
          predicates:
            - Path=/doc/**, /file/**, /search/**, /collab/**, /notification/**, /onboarding/**
```

---

## 8. 部署变更

### 8.1 docker-compose.prod.yml 新增

```yaml
  # ========== 微服务网关 ==========
  gateway:
    image: ${CI_REGISTRY_IMAGE:-sass-kb}/taoyue-gateway:latest
    ports:
      - "80:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JWT_SECRET: ${JWT_SECRET}
      NACOS_SERVER_ADDR: nacos:8849
    depends_on:
      nacos:
        condition: service_healthy
      taoyue-auth:
        condition: service_healthy
    restart: always

  # ========== Nacos 注册/配置中心 ==========
  nacos:
    image: nacos/nacos-server:v2.3.0
    environment:
      MODE: standalone
    ports:
      - "127.0.0.1:8849:8849"
    restart: always

  # ========== 统一认证服务 ==========
  taoyue-auth:
    image: ${CI_REGISTRY_IMAGE:-sass-kb}/taoyue-auth:latest
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/sass_kb
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_DATA_REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
      NACOS_SERVER_ADDR: nacos:8849
    ports:
      - "127.0.0.1:8081:8081"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      nacos:
        condition: service_healthy
    restart: always
```

### 8.2 SASS KB 后端更新

```yaml
  backend:
    # 移除 JWT 相关环境变量（JWT 由 Gateway + taoyue-auth 管理）
    # 新增 Nacos 注册配置
    environment:
      NACOS_SERVER_ADDR: nacos:8849
```

---

## 9. 迁移步骤

### 第 1 步：准备 taoyue-auth（预计 2-3 天）

- taoyue-common 补充 `BizException`、`TenantContext`
- taoyue-auth 的 pom.xml 加依赖（MyBatis-Plus, PG, jjwt, Redis, Caffeine, Hutool）
- 迁入全部 Java 文件，改包名 `com.sass.kb.auth` → `com.zhentao.auth`
- 处理 import 替换：`R` → `com.zhentao.common.result.R`、`BizException` → `com.zhentao.common.exception.BizException`
- 写 Flyway 迁移脚本建表
- 本地 `mvn compile` 验证通过
- 启动 taoyue-auth，验证 CRUD 接口正常

**验证标准：** taoyue-auth 独立启动，登录/注册/用户CRUD 全部通过 Postman 测试

### 第 2 步：Gateway 集成（预计 1 天）

- Gateway 添加 `AuthGlobalFilter`
- Gateway 路由配置指向各服务
- 前端登录 URL 改为指向 Gateway
- 全链路测试：前端 → Gateway → taoyue-auth → 返回 JWT

**验证标准：** 前端通过 Gateway 登录成功，拿到 token

### 第 3 步：SASS KB 拆离 auth（预计 2 天）

- SASS KB 注册到 Nacos（加 `spring-cloud-starter-alibaba-nacos-discovery`）
- 新建 `AuthClient`（RestClient 调 taoyue-auth）
- `WebMvcConfig` 替换拦截器为 `GatewayHeaderFilter`
- `sass-kb-web/pom.xml` 移除 auth 依赖
- 父 pom.xml 移除 auth 模块
- `grep -r "com.sass.kb.auth"` 全量扫描隐式依赖并修复
- 业务模块适配（从 Header 取 userId 替代 `request.getAttribute`）

**验证标准：** SASS KB 所有业务接口通过 Gateway 访问正常，CRUD 文档、搜索、文件上传全通

### 第 4 步：清理收尾（预计 1 天）

- `sass-kb-auth/` 目录删除
- `docker-compose.prod.yml` 更新（删除 backend 中 JWT 环境变量，新增 gateway/nacos/taoyue-auth）
- `.gitlab-ci.yml` 新增 taoyue-auth、taoyue-gateway 镜像构建
- 端到端回归测试

**验证标准：** `docker compose up -d` 全部服务启动，完整用户流程（注册 → 登录 → 创建文档 → 权限校验 → 搜索）通过

---

## 10. 风险与应对

| 风险 | 影响 | 概率 | 应对 |
|------|------|------|------|
| Gateway 单点故障 | 所有服务不可访问 | 低 | 生产部署多实例 + Nginx 前置负载均衡 |
| taoyue-auth 服务宕机 | 登录和鉴权不可用 | 低 | Caffeine 本地缓存权限数据，短时间降级可用 |
| 包名迁移遗漏 | 编译失败 | 中 | 第 1 步本地 `mvn compile` 通过后再继续；第 3 步 `grep` 全量扫描 |
| SASS KB 隐式依赖 auth 类 | 编译/运行时错误 | 中 | 迁移前 `grep -r "com.sass.kb.auth"` 全量扫描 |
| Flyway 版本号冲突 | 启动失败 | 低 | 共用 `flyway_schema_history`，提前协调版本号 |
| 网络延迟增加 | 鉴权变慢 | 中 | Gateway AuthFilter 用本地 JWT 验签（不调 auth），权限查询走 Redis 缓存 |

---

## 11. taoyue-auth 新增依赖清单

```xml
<!-- pom.xml 新增 -->
<dependencies>
    <!-- 已有：taoyue-common -->
    
    <!-- 数据库 -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>

    <!-- 缓存 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    <dependency>
        <groupId>com.github.ben-manes.caffeine</groupId>
        <artifactId>caffeine</artifactId>
    </dependency>

    <!-- 工具 -->
    <dependency>
        <groupId>cn.hutool</groupId>
        <artifactId>hutool-all</artifactId>
        <version>5.8.24</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-aop</artifactId>
    </dependency>

    <!-- API 文档 -->
    <dependency>
        <groupId>com.github.xiaoymin</groupId>
        <artifactId>knife4j-openapi3-jakarta-spring-boot-starter</artifactId>
    </dependency>
</dependencies>
```
