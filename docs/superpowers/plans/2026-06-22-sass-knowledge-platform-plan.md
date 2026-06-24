# SASS 知识平台管理 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 SaaS 企业知识库平台：管理后台（React + Ant Design + TS）+ APP 端（React Native + Expo）+ Java 后端（Spring Boot 3），分 6 个阶段交付。

**Architecture:** 模块化单体 Java 后端 + REST API（JWT 鉴权）+ React Admin（Vite + Zustand）+ React Native APP（Expo + WebView 富文本）。PostgreSQL 存业务数据，Elasticsearch 做全文搜索，MinIO 做文件存储，Redis+Caffeine 做二级缓存，RabbitMQ 做异步解耦。

**Tech Stack:** Spring Boot 3 + JDK 17 + MyBatis-Plus + PostgreSQL + Elasticsearch 8 + MinIO + RabbitMQ + Redis + Caffeine | React 18 + Ant Design 5 + Vite + Zustand + TanStack Query + Tiptap | Expo + React Navigation 6 + Zustand + TanStack Query + WebView

## 全局约束

- 后端端口：8080，管理后台端口：5173（Vite 默认），APP Expo 端口：8081
- 所有 API 路径以 `/api/` 为前缀
- JWT AccessToken 有效期 30min，RefreshToken 有效期 7 天
- 租户隔离通过 MyBatis-Plus 拦截器自动追加 `WHERE tenant_id = ?`，公共文库 `tenant_id = NULL`
- 权限模型：RBAC + ACL，deny 优先于 allow
- 文档内容存储格式：Tiptap JSON（content_json）+ 导出 HTML（content_html）
- 版本管理使用乐观锁，保存时携带 version 字段
- 代码规范：ESLint + Prettier + Husky

---

## Phase 1：地基（项目骨架 + 认证 + 租户/用户 CRUD）

### 1.1 后端：项目骨架搭建

#### Task 1.1.1：初始化 Spring Boot 多模块项目

**Files:**
- Create: `sass-kb-server/pom.xml`
- Create: `sass-kb-server/sass-kb-common/pom.xml`
- Create: `sass-kb-server/sass-kb-tenant/pom.xml`
- Create: `sass-kb-server/sass-kb-auth/pom.xml`
- Create: `sass-kb-server/sass-kb-doc/pom.xml`
- Create: `sass-kb-server/sass-kb-file/pom.xml`
- Create: `sass-kb-server/sass-kb-search/pom.xml`
- Create: `sass-kb-server/sass-kb-collaboration/pom.xml`
- Create: `sass-kb-server/sass-kb-notification/pom.xml`
- Create: `sass-kb-server/sass-kb-web/pom.xml`

**Interfaces:**
- Produces: 多模块 Maven 项目结构，sass-kb-web 作为启动模块，依赖所有子模块

- [ ] **Step 1：创建父 pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.sass.kb</groupId>
    <artifactId>sass-kb-server</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>
    <name>SASS Knowledge Base Server</name>
    <description>SaaS 企业知识库管理平台后端</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <properties>
        <java.version>17</java.version>
        <mybatis-plus.version>3.5.5</mybatis-plus.version>
        <knife4j.version>4.4.0</knife4j.version>
        <hutool.version>5.8.24</hutool.version>
        <java-diff-utils.version>4.12</java-diff-utils.version>
    </properties>

    <modules>
        <module>sass-kb-common</module>
        <module>sass-kb-tenant</module>
        <module>sass-kb-auth</module>
        <module>sass-kb-doc</module>
        <module>sass-kb-file</module>
        <module>sass-kb-search</module>
        <module>sass-kb-collaboration</module>
        <module>sass-kb-notification</module>
        <module>sass-kb-web</module>
    </modules>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.baomidou</groupId>
                <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
                <version>${mybatis-plus.version}</version>
            </dependency>
            <dependency>
                <groupId>com.github.xiaoymin</groupId>
                <artifactId>knife4j-openapi3-jakarta-spring-boot-starter</artifactId>
                <version>${knife4j.version}</version>
            </dependency>
            <dependency>
                <groupId>cn.hutool</groupId>
                <artifactId>hutool-all</artifactId>
                <version>${hutool.version}</version>
            </dependency>
            <dependency>
                <groupId>io.github.java-diff-utils</groupId>
                <artifactId>java-diff-utils</artifactId>
                <version>${java-diff-utils.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

- [ ] **Step 2：创建 sass-kb-common/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.sass.kb</groupId>
        <artifactId>sass-kb-server</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <artifactId>sass-kb-common</artifactId>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 3：创建 sass-kb-web/pom.xml 及启动类**

```xml
<!-- sass-kb-web/pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.sass.kb</groupId>
        <artifactId>sass-kb-server</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <artifactId>sass-kb-web</artifactId>
    <dependencies>
        <dependency><groupId>com.sass.kb</groupId><artifactId>sass-kb-common</artifactId><version>${project.version}</version></dependency>
        <dependency><groupId>com.sass.kb</groupId><artifactId>sass-kb-tenant</artifactId><version>${project.version}</version></dependency>
        <dependency><groupId>com.sass.kb</groupId><artifactId>sass-kb-auth</artifactId><version>${project.version}</version></dependency>
        <dependency><groupId>com.sass.kb</groupId><artifactId>sass-kb-doc</artifactId><version>${project.version}</version></dependency>
        <dependency><groupId>com.sass.kb</groupId><artifactId>sass-kb-file</artifactId><version>${project.version}</version></dependency>
        <dependency><groupId>com.sass.kb</groupId><artifactId>sass-kb-search</artifactId><version>${project.version}</version></dependency>
        <dependency><groupId>com.sass.kb</groupId><artifactId>sass-kb-collaboration</artifactId><version>${project.version}</version></dependency>
        <dependency><groupId>com.sass.kb</groupId><artifactId>sass-kb-notification</artifactId><version>${project.version}</version></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

```java
// sass-kb-web/src/main/java/com/sass/kb/KbApplication.java
package com.sass.kb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class KbApplication {
    public static void main(String[] args) {
        SpringApplication.run(KbApplication.class, args);
    }
}
```

- [ ] **Step 4：创建 application.yml**

```yaml
# sass-kb-web/src/main/resources/application.yml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/sass_kb
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver
  elasticsearch:
    uris: http://localhost:9200
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
  data:
    redis:
      host: localhost
      port: 6379

mybatis-plus:
  mapper-locations: classpath*:/mapper/**/*.xml
  global-config:
    db-config:
      id-type: assign_id
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

minio:
  endpoint: http://localhost:9000
  access-key: minioadmin
  secret-key: minioadmin
  bucket: sass-kb-files

jwt:
  secret: your-256-bit-secret-key-change-in-production
  access-token-expire: 30   # 分钟
  refresh-token-expire: 10080  # 分钟 (7天)

knife4j:
  enable: true
```

- [ ] **Step 5：配置 Git .gitignore**

```gitignore
# sass-kb-server/.gitignore
target/
!.mvn/wrapper/maven-wrapper.jar
*.class
*.jar
*.war
.idea/
*.iml
*.iws
*.ipr
.project
.settings/
.classpath
*.log
```

- [ ] **Step 6：编译验证**

```bash
cd sass-kb-server && mvn compile -q
```
预期：BUILD SUCCESS

- [ ] **Step 7：Commit**

```bash
git add sass-kb-server/
git commit -m "feat: init Spring Boot 3 multi-module project skeleton"
```

---

#### Task 1.1.2：公共模块基础类

**Files:**
- Create: `sass-kb-server/sass-kb-common/src/main/java/com/sass/kb/common/result/R.java`
- Create: `sass-kb-server/sass-kb-common/src/main/java/com/sass/kb/common/result/PageResult.java`
- Create: `sass-kb-server/sass-kb-common/src/main/java/com/sass/kb/common/exception/BizException.java`
- Create: `sass-kb-server/sass-kb-common/src/main/java/com/sass/kb/common/exception/GlobalExceptionHandler.java`

**Interfaces:**
- Produces:
  - `R<T>` — 统一响应体：`code: int`, `message: str`, `data: T`
  - `R.ok(T data)`, `R.fail(int code, String msg)`
  - `PageResult<T>` — 分页响应：`records: List<T>`, `total: long`, `page: int`, `size: int`
  - `BizException` — 业务异常：`code: int`, `message: str`
  - `GlobalExceptionHandler` — 全局异常拦截，将 `BizException` 转为 `R.fail`

- [ ] **Step 1：写统一响应体 R.java**

```java
package com.sass.kb.common.result;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class R<T> {
    private int code;
    private String message;
    private T data;

    public static <T> R<T> ok(T data) {
        return new R<>(200, "success", data);
    }

    public static <T> R<T> ok() {
        return ok(null);
    }

    public static <T> R<T> fail(int code, String message) {
        return new R<>(code, message, null);
    }

    public boolean isSuccess() {
        return code == 200;
    }
}
```

- [ ] **Step 2：写分页响应体 PageResult.java**

```java
package com.sass.kb.common.result;

import lombok.Data;
import java.util.List;

@Data
public class PageResult<T> {
    private List<T> records;
    private long total;
    private int page;
    private int size;

    public PageResult(List<T> records, long total, int page, int size) {
        this.records = records;
        this.total = total;
        this.page = page;
        this.size = size;
    }
}
```

- [ ] **Step 3：写业务异常类**

```java
package com.sass.kb.common.exception;

import lombok.Getter;

@Getter
public class BizException extends RuntimeException {
    private final int code;

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BizException(String message) {
        this(400, message);
    }
}
```

- [ ] **Step 4：写全局异常处理器**

```java
package com.sass.kb.common.exception;

import com.sass.kb.common.result.R;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    @ResponseStatus(HttpStatus.OK)
    public R<Void> handleBizException(BizException e) {
        log.warn("业务异常: code={}, message={}", e.getCode(), e.getMessage());
        return R.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public R<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return R.fail(500, "服务器内部错误");
    }
}
```

- [ ] **Step 5：编译验证**

```bash
cd sass-kb-server && mvn compile -q
```
预期：BUILD SUCCESS

- [ ] **Step 6：Commit**

```bash
git add sass-kb-server/sass-kb-common/
git commit -m "feat: add common result wrapper, exception handler"
```

---

### 1.2 后端：数据库初始化

#### Task 1.2.1：创建数据库表结构

**Files:**
- Create: `sass-kb-server/sass-kb-web/src/main/resources/db/migration/V1__init_tables.sql`

**Interfaces:**
- Produces: `tenant`, `user`, `space`, `folder`, `document`, `document_version`, `comment`, `file_asset`, `role`, `permission_rule` 十张基础表

- [ ] **Step 1：写建表 SQL**

```sql
-- V1__init_tables.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 租户表
CREATE TABLE tenant (
    id              VARCHAR(32) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    logo_url        VARCHAR(500),
    contact_name    VARCHAR(50),
    contact_phone   VARCHAR(20),
    max_user_count  INT DEFAULT 50,
    status          VARCHAR(20) DEFAULT 'active',  -- active | disabled
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

-- 用户表
CREATE TABLE "user" (
    id              VARCHAR(32) PRIMARY KEY,
    tenant_id       VARCHAR(32) REFERENCES tenant(id),
    username        VARCHAR(50) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    real_name       VARCHAR(50),
    email           VARCHAR(100),
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    status          VARCHAR(20) DEFAULT 'active',
    is_super_admin  BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
CREATE UNIQUE INDEX idx_user_username_tenant ON "user"(tenant_id, username);

-- 知识空间表
CREATE TABLE space (
    id              VARCHAR(32) PRIMARY KEY,
    tenant_id       VARCHAR(32) REFERENCES tenant(id),
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    icon            VARCHAR(100),
    type            VARCHAR(20) DEFAULT 'private',  -- public | private
    sort_order      INT DEFAULT 0,
    created_by      VARCHAR(32) REFERENCES "user"(id),
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

-- 文件夹表（树形结构）
CREATE TABLE folder (
    id              VARCHAR(32) PRIMARY KEY,
    space_id        VARCHAR(32) NOT NULL REFERENCES space(id),
    parent_id       VARCHAR(32) REFERENCES folder(id),
    name            VARCHAR(200) NOT NULL,
    sort_order      INT DEFAULT 0,
    created_by      VARCHAR(32) REFERENCES "user"(id),
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_folder_space ON folder(space_id);
CREATE INDEX idx_folder_parent ON folder(parent_id);

-- 文档表
CREATE TABLE document (
    id              VARCHAR(32) PRIMARY KEY,
    space_id        VARCHAR(32) NOT NULL REFERENCES space(id),
    folder_id       VARCHAR(32) REFERENCES folder(id),
    tenant_id       VARCHAR(32),
    title           VARCHAR(500) NOT NULL,
    content_json    JSONB,
    content_html    TEXT,
    status          VARCHAR(20) DEFAULT 'draft',  -- draft | published | archived
    version         INT DEFAULT 1,
    created_by      VARCHAR(32) REFERENCES "user"(id),
    updated_by      VARCHAR(32) REFERENCES "user"(id),
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_doc_space ON document(space_id);
CREATE INDEX idx_doc_folder ON document(folder_id);
CREATE INDEX idx_doc_tenant ON document(tenant_id);
CREATE INDEX idx_doc_title_trgm ON document USING gin(title gin_trgm_ops);

-- 文档版本表
CREATE TABLE document_version (
    id              VARCHAR(32) PRIMARY KEY,
    document_id     VARCHAR(32) NOT NULL REFERENCES document(id),
    version_number  INT NOT NULL,
    content_json    JSONB,
    content_html    TEXT,
    change_summary  VARCHAR(500),
    created_by      VARCHAR(32) REFERENCES "user"(id),
    created_at      TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_doc_version_doc ON document_version(document_id);

-- 评论表
CREATE TABLE comment (
    id              VARCHAR(32) PRIMARY KEY,
    document_id     VARCHAR(32) NOT NULL REFERENCES document(id),
    parent_id       VARCHAR(32) REFERENCES comment(id),
    content         TEXT NOT NULL,
    created_by      VARCHAR(32) REFERENCES "user"(id),
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_comment_doc ON comment(document_id);

-- 文件资产表
CREATE TABLE file_asset (
    id              VARCHAR(32) PRIMARY KEY,
    tenant_id       VARCHAR(32),
    space_id        VARCHAR(32) REFERENCES space(id),
    original_name   VARCHAR(500) NOT NULL,
    store_path      VARCHAR(500) NOT NULL,
    file_size       BIGINT,
    mime_type       VARCHAR(100),
    created_by      VARCHAR(32) REFERENCES "user"(id),
    created_at      TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_file_tenant ON file_asset(tenant_id);

-- 角色表
CREATE TABLE role (
    id              VARCHAR(32) PRIMARY KEY,
    tenant_id       VARCHAR(32) REFERENCES tenant(id),
    name            VARCHAR(50) NOT NULL,
    description     VARCHAR(200),
    permissions     TEXT[] DEFAULT '{}',  -- ["doc:read", "doc:write", ...]
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

-- 权限规则表（ACL）
CREATE TABLE permission_rule (
    id              VARCHAR(32) PRIMARY KEY,
    tenant_id       VARCHAR(32),
    subject_type    VARCHAR(10) NOT NULL,  -- user | role
    subject_id      VARCHAR(32) NOT NULL,
    target_type     VARCHAR(10) NOT NULL,  -- space | folder | doc | file
    target_id       VARCHAR(32),
    action          VARCHAR(20) NOT NULL,  -- read | write | admin | delete
    effect          VARCHAR(10) DEFAULT 'allow'  -- allow | deny
);
CREATE INDEX idx_perm_subject ON permission_rule(subject_type, subject_id);
CREATE INDEX idx_perm_target ON permission_rule(target_type, target_id);
```

- [ ] **Step 2：配置 PostgreSQL 并执行 SQL**

```bash
# 创建数据库（需本地 PostgreSQL 已安装）
psql -U postgres -c "CREATE DATABASE sass_kb;"
psql -U postgres -d sass_kb -f sass-kb-web/src/main/resources/db/migration/V1__init_tables.sql
```

- [ ] **Step 3：Commit**

```bash
git add sass-kb-server/sass-kb-web/src/main/resources/db/
git commit -m "feat: add database schema for tenant, user, space, doc, file, role, permission"
```

---

### 1.3 后端：认证 & 租户

#### Task 1.3.1：JWT 工具类 + 租户上下文

**Files:**
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/util/JwtUtil.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/config/JwtProperties.java`
- Create: `sass-kb-server/sass-kb-tenant/src/main/java/com/sass/kb/tenant/context/TenantContext.java`
- Create: `sass-kb-server/sass-kb-tenant/src/main/java/com/sass/kb/tenant/context/TenantInterceptor.java`

**Interfaces:**
- Produces:
  - `JwtUtil.generateAccessToken(userId, tenantId) : String`
  - `JwtUtil.generateRefreshToken(userId) : String`
  - `JwtUtil.validateToken(token) : Claims`
  - `JwtUtil.getUserId(token) : String`
  - `JwtUtil.getTenantId(token) : String`
  - `TenantContext.getCurrentTenantId() : String`
  - `TenantContext.setCurrentTenantId(String)`

- [ ] **Step 1：写 JwtProperties 配置类**

```java
package com.sass.kb.auth.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret;
    private int accessTokenExpire;
    private int refreshTokenExpire;
}
```

- [ ] **Step 2：写 JwtUtil**

```java
package com.sass.kb.auth.util;

import com.sass.kb.auth.config.JwtProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final JwtProperties jwtProperties;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(String userId, String tenantId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getAccessTokenExpire() * 60_000L);
        return Jwts.builder()
                .subject(userId)
                .claim("tenantId", tenantId)
                .claim("type", "access")
                .id(UUID.randomUUID().toString())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getKey())
                .compact();
    }

    public String generateRefreshToken(String userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getRefreshTokenExpire() * 60_000L);
        return Jwts.builder()
                .subject(userId)
                .claim("type", "refresh")
                .id(UUID.randomUUID().toString())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getKey())
                .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUserId(String token) {
        return validateToken(token).getSubject();
    }

    public String getTenantId(String token) {
        return validateToken(token).get("tenantId", String.class);
    }
}
```

> **依赖补充：** sass-kb-auth/pom.xml 需添加 `jjwt-api`、`jjwt-impl`、`jjwt-jackson` 依赖。

- [ ] **Step 3：写 TenantContext（ThreadLocal）**

```java
package com.sass.kb.tenant.context;

public class TenantContext {
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    public static void setCurrentTenantId(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static String getCurrentTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
```

- [ ] **Step 4：写 JWT 拦截器**

```java
package com.sass.kb.auth.interceptor;

import com.sass.kb.auth.util.JwtUtil;
import com.sass.kb.tenant.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = extractToken(request);
        if (token == null) {
            response.setStatus(401);
            return false;
        }
        try {
            String userId = jwtUtil.getUserId(token);
            String tenantId = jwtUtil.getTenantId(token);
            request.setAttribute("userId", userId);
            request.setAttribute("tenantId", tenantId);
            TenantContext.setCurrentTenantId(tenantId);
            return true;
        } catch (Exception e) {
            response.setStatus(401);
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        TenantContext.clear();
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
```

- [ ] **Step 5：注册拦截器**

```java
package com.sass.kb.auth.config;

import com.sass.kb.auth.interceptor.AuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/login", "/api/auth/register",
                        "/v3/api-docs/**", "/doc.html", "/swagger-ui/**");
    }
}
```

> 此文件放在 sass-kb-web 中（需要扫描到 `sass-kb-auth` 和 `sass-kb-tenant` 的 Bean）。

- [ ] **Step 6：编译验证**

```bash
cd sass-kb-server && mvn compile -q
```
预期：BUILD SUCCESS

- [ ] **Step 7：Commit**

```bash
git add sass-kb-server/sass-kb-auth/ sass-kb-server/sass-kb-tenant/ sass-kb-server/sass-kb-web/
git commit -m "feat: add JWT utility, tenant context, auth interceptor"
```

---

#### Task 1.3.2：用户登录/注册 API

**Files:**
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/entity/User.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/mapper/UserMapper.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/dto/LoginRequest.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/dto/TokenResponse.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/service/AuthService.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/controller/AuthController.java`

**Interfaces:**
- Consumes: `JwtUtil.generateAccessToken`, `JwtUtil.generateRefreshToken`
- Produces:
  - `POST /api/auth/login` → `{ account, password }` → `TokenResponse { accessToken, refreshToken, userId, realName }`
  - `POST /api/auth/refresh` → `{ refreshToken }` → `TokenResponse`

- [ ] **Step 1：写 User 实体**

```java
package com.sass.kb.auth.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("\"user\"")
public class User {
    @TableId
    private String id;
    private String tenantId;
    private String username;
    private String passwordHash;
    private String realName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String status;
    private Boolean isSuperAdmin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 2：写 UserMapper**

```java
package com.sass.kb.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sass.kb.auth.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
```

- [ ] **Step 3：写 DTO**

```java
package com.sass.kb.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "账号不能为空")
    private String account;

    @NotBlank(message = "密码不能为空")
    private String password;
}
```

```java
package com.sass.kb.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
    private String userId;
    private String realName;
}
```

- [ ] **Step 4：写 AuthService**

```java
package com.sass.kb.auth.service;

import cn.hutool.core.util.IdUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sass.kb.auth.dto.LoginRequest;
import com.sass.kb.auth.dto.TokenResponse;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.auth.util.JwtUtil;
import com.sass.kb.common.exception.BizException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;

    public TokenResponse login(LoginRequest req) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, req.getAccount()));
        if (user == null || !BCrypt.checkpw(req.getPassword(), user.getPasswordHash())) {
            throw new BizException(401, "账号或密码错误");
        }
        if (!"active".equals(user.getStatus())) {
            throw new BizException(403, "账号已被禁用");
        }
        String tenantId = user.getIsSuperAdmin() ? null : user.getTenantId();
        String accessToken = jwtUtil.generateAccessToken(user.getId(), tenantId);
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        return new TokenResponse(accessToken, refreshToken, user.getId(), user.getRealName());
    }

    public TokenResponse refresh(String refreshToken) {
        String userId = jwtUtil.getUserId(refreshToken);
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BizException(401, "用户不存在");
        }
        String tenantId = user.getIsSuperAdmin() ? null : user.getTenantId();
        String newAccessToken = jwtUtil.generateAccessToken(userId, tenantId);
        String newRefreshToken = jwtUtil.generateRefreshToken(userId);
        return new TokenResponse(newAccessToken, newRefreshToken, userId, user.getRealName());
    }
}
```

- [ ] **Step 5：写 AuthController**

```java
package com.sass.kb.auth.controller;

import com.sass.kb.auth.dto.LoginRequest;
import com.sass.kb.auth.dto.TokenResponse;
import com.sass.kb.auth.service.AuthService;
import com.sass.kb.common.result.R;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public R<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
        return R.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public R<TokenResponse> refresh(@RequestBody TokenResponse req) {
        return R.ok(authService.refresh(req.getRefreshToken()));
    }
}
```

- [ ] **Step 6：插入初始超管（测试用）**

```sql
INSERT INTO tenant (id, name) VALUES ('tenant_public', '公共租户');

INSERT INTO "user" (id, tenant_id, username, password_hash, real_name, is_super_admin)
VALUES ('user_admin', NULL, 'admin', '$2a$10$...', '超级管理员', true);
-- 注意：password_hash 需用 BCrypt 生成，测试密码 'admin123'
```

- [ ] **Step 7：编译验证 & Commit**

```bash
cd sass-kb-server && mvn compile -q
git add sass-kb-server/sass-kb-auth/
git commit -m "feat: add login/refresh API with JWT auth"
```

---

#### Task 1.3.3：租户 & 用户管理 CRUD

**Files:**
- Create: `sass-kb-server/sass-kb-tenant/src/main/java/com/sass/kb/tenant/controller/TenantController.java`
- Create: `sass-kb-server/sass-kb-tenant/src/main/java/com/sass/kb/tenant/service/TenantService.java`
- Create: `sass-kb-server/sass-kb-tenant/src/main/java/com/sass/kb/tenant/entity/Tenant.java`
- Create: `sass-kb-server/sass-kb-tenant/src/main/java/com/sass/kb/tenant/mapper/TenantMapper.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/controller/UserController.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/service/UserService.java`

**Interfaces:**
- Consumes: `TenantContext.getCurrentTenantId()`
- Produces:
  - `GET /api/tenant/list` → `PageResult<Tenant>`（超管专享）
  - `POST /api/tenant` → 创建租户（超管）
  - `GET /api/user/list` → 本租户用户列表
  - `POST /api/user` → 创建用户
  - `PUT /api/user/{id}` → 编辑用户
  - `PUT /api/user/{id}/status` → 启用/禁用用户
  - `PUT /api/user/{id}/password` → 重置密码

- [ ] **Step 1：写 TenantController（超管鉴权 + CRUD）**

```java
package com.sass.kb.tenant.controller;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.tenant.entity.Tenant;
import com.sass.kb.tenant.mapper.TenantMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenant")
@RequiredArgsConstructor
public class TenantController {

    private final TenantMapper tenantMapper;

    @GetMapping("/list")
    public R<PageResult<Tenant>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<Tenant> qw = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            qw.like(Tenant::getName, keyword);
        }
        qw.orderByDesc(Tenant::getCreatedAt);
        Page<Tenant> p = tenantMapper.selectPage(new Page<>(page, size), qw);
        return R.ok(new PageResult<>(p.getRecords(), p.getTotal(), page, size));
    }

    @PostMapping
    public R<Tenant> create(@Valid @RequestBody Tenant tenant) {
        tenant.setId(IdUtil.fastSimpleUUID());
        tenant.setStatus("active");
        tenantMapper.insert(tenant);
        return R.ok(tenant);
    }

    @PutMapping("/{id}")
    public R<Void> update(@PathVariable String id, @RequestBody Tenant tenant) {
        tenant.setId(id);
        tenantMapper.updateById(tenant);
        return R.ok();
    }

    @PutMapping("/{id}/status")
    public R<Void> toggleStatus(@PathVariable String id, @RequestParam String status) {
        Tenant t = new Tenant();
        t.setId(id);
        t.setStatus(status);
        tenantMapper.updateById(t);
        return R.ok();
    }
}
```

- [ ] **Step 2：写 UserController（租户范围内 CRUD）**

```java
package com.sass.kb.auth.controller;

import cn.hutool.core.util.IdUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.tenant.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserMapper userMapper;

    @GetMapping("/list")
    public R<PageResult<User>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        String tenantId = TenantContext.getCurrentTenantId();
        LambdaQueryWrapper<User> qw = new LambdaQueryWrapper<>();
        qw.eq(User::getTenantId, tenantId);
        if (keyword != null && !keyword.isBlank()) {
            qw.and(w -> w.like(User::getUsername, keyword)
                    .or().like(User::getRealName, keyword));
        }
        qw.orderByDesc(User::getCreatedAt);
        Page<User> p = userMapper.selectPage(new Page<>(page, size), qw);
        // 不返回 password_hash
        p.getRecords().forEach(u -> u.setPasswordHash(null));
        return R.ok(new PageResult<>(p.getRecords(), p.getTotal(), page, size));
    }

    @PostMapping
    public R<User> create(@Valid @RequestBody User user, HttpServletRequest request) {
        String tenantId = TenantContext.getCurrentTenantId();
        String currentUserId = (String) request.getAttribute("userId");
        // 重名校验
        if (userMapper.exists(new LambdaQueryWrapper<User>()
                .eq(User::getTenantId, tenantId)
                .eq(User::getUsername, user.getUsername()))) {
            throw new BizException("用户名已存在");
        }
        user.setId(IdUtil.fastSimpleUUID());
        user.setTenantId(tenantId);
        user.setPasswordHash(BCrypt.hashpw("123456")); // 默认密码
        user.setStatus("active");
        user.setIsSuperAdmin(false);
        userMapper.insert(user);
        user.setPasswordHash(null);
        return R.ok(user);
    }

    @PutMapping("/{id}")
    public R<Void> update(@PathVariable String id, @RequestBody User user) {
        user.setId(id);
        user.setPasswordHash(null); // 不允许直接改密码
        userMapper.updateById(user);
        return R.ok();
    }

    @PutMapping("/{id}/status")
    public R<Void> toggleStatus(@PathVariable String id, @RequestParam String status) {
        User u = new User();
        u.setId(id);
        u.setStatus(status);
        userMapper.updateById(u);
        return R.ok();
    }

    @PutMapping("/{id}/password")
    public R<Void> resetPassword(@PathVariable String id) {
        User u = new User();
        u.setId(id);
        u.setPasswordHash(BCrypt.hashpw("123456"));
        userMapper.updateById(u);
        return R.ok();
    }

    @GetMapping("/me")
    public R<User> me(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        User user = userMapper.selectById(userId);
        if (user != null) user.setPasswordHash(null);
        return R.ok(user);
    }
}
```

- [ ] **Step 3：编译验证 & Commit**

```bash
cd sass-kb-server && mvn compile -q
git add sass-kb-server/sass-kb-tenant/ sass-kb-server/sass-kb-auth/
git commit -m "feat: add tenant CRUD and user management APIs"
```

---

### 1.4 管理后台：项目骨架 & 登录

#### Task 1.4.1：初始化 Vite + React + Ant Design 项目

**Files:**
- Create: `sass-kb-admin/` 整个项目

- [ ] **Step 1：使用 Vite 创建项目**

```bash
npm create vite@latest sass-kb-admin -- --template react-ts
cd sass-kb-admin
npm install
```

- [ ] **Step 2：安装依赖**

```bash
npm install antd @ant-design/icons react-router-dom zustand axios @tanstack/react-query
npm install -D @types/node
```

- [ ] **Step 3：写 vite.config.ts（代理配置）**

```typescript
// sass-kb-admin/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 4：写路由配置**

```typescript
// sass-kb-admin/src/routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import AuthGuard from './AuthGuard';
import { lazy } from 'react';

const LoginPage = lazy(() => import('@/pages/login'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const TenantPage = lazy(() => import('@/pages/tenant'));
const UserPage = lazy(() => import('@/pages/user'));
const SpacePage = lazy(() => import('@/pages/space'));
const DocPage = lazy(() => import('@/pages/doc'));
const FilePage = lazy(() => import('@/pages/file'));
const SearchPage = lazy(() => import('@/pages/search'));
const RolePage = lazy(() => import('@/pages/role'));
const AuditPage = lazy(() => import('@/pages/audit'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/',
    element: <AuthGuard><MainLayout /></AuthGuard>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'tenant', element: <TenantPage /> },
      { path: 'user', element: <UserPage /> },
      { path: 'space', element: <SpacePage /> },
      { path: 'space/:spaceId', element: <DocPage /> },
      { path: 'doc/:docId', element: <DocPage /> },
      { path: 'file', element: <FilePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'role', element: <RolePage /> },
      { path: 'audit', element: <AuditPage /> },
    ],
  },
]);
```

- [ ] **Step 5：写 AuthGuard**

```typescript
// sass-kb-admin/src/routes/AuthGuard.tsx
import { useAuthStore } from '@/stores/authStore';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 6：Commit**

```bash
git add sass-kb-admin/
git commit -m "feat: init admin project with Vite, React Router, Ant Design"
```

---

#### Task 1.4.2：Axios 实例 + AuthStore + 登录页

**Files:**
- Create: `sass-kb-admin/src/services/api.ts`
- Create: `sass-kb-admin/src/services/authService.ts`
- Create: `sass-kb-admin/src/stores/authStore.ts`
- Create: `sass-kb-admin/src/pages/login/index.tsx`
- Create: `sass-kb-admin/src/layouts/AuthLayout.tsx`
- Create: `sass-kb-admin/src/layouts/MainLayout.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/login` → `TokenResponse`
- Produces: `authStore.accessToken`, `authStore.login(account, password)`, `authStore.logout()`

- [ ] **Step 1：写 Axios 实例（token 拦截 + 自动刷新）**

```typescript
// sass-kb-admin/src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截：自动挂 token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：401 自动刷新或跳登录
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      if (!refreshToken) { logout(); return Promise.reject(error); }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken });
        const data = res.data.data;
        setTokens(data.accessToken, data.refreshToken);
        refreshQueue.forEach((cb) => cb(data.accessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        logout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 2：写 authStore**

```typescript
// sass-kb-admin/src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  realName: string | null;
  login: (account: string, password: string) => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
  setUser: (userId: string, realName: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      realName: null,
      login: async (account, password) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account, password }),
        });
        const json = await res.json();
        if (json.code !== 200) throw new Error(json.message);
        const d = json.data;
        set({
          accessToken: d.accessToken,
          refreshToken: d.refreshToken,
          userId: d.userId,
          realName: d.realName,
        });
      },
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (userId, realName) => set({ userId, realName }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, userId: null, realName: null }),
    }),
    { name: 'sass-kb-auth' }
  )
);
```

> 注：登录这里直接用 fetch 避免 axios 拦截器循环依赖。后续用 `api` 实例调其他接口。

- [ ] **Step 3：写登录页**

```typescript
// sass-kb-admin/src/pages/login/index.tsx
import { Button, Card, Form, Input, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const onFinish = async (values: { account: string; password: string }) => {
    try {
      await login(values.account, values.password);
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (e: any) {
      message.error(e.message || '登录失败');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3}>SASS 知识平台</Title>
          <Text type="secondary">企业知识库管理系统</Text>
        </div>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="account" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="账号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>登录</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4：写 MainLayout（侧边栏 + 顶栏 + 内容区）**

```typescript
// sass-kb-admin/src/layouts/MainLayout.tsx
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import {
  DashboardOutlined, TeamOutlined, UserOutlined, FolderOpenOutlined,
  FileOutlined, SearchOutlined, SafetyOutlined, AuditOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/space', icon: <FolderOpenOutlined />, label: '知识空间' },
  { key: '/file', icon: <FileOutlined />, label: '文件管理' },
  { key: '/search', icon: <SearchOutlined />, label: '搜索' },
  { key: '/user', icon: <UserOutlined />, label: '用户管理' },
  { key: '/role', icon: <SafetyOutlined />, label: '角色权限' },
  { key: '/tenant', icon: <TeamOutlined />, label: '租户管理' },
  { key: '/audit', icon: <AuditOutlined />, label: '审计日志' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { realName, logout } = useAuthStore();
  const { token: { colorBgContainer } } = theme.useToken();

  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 48, margin: 16, color: '#fff', fontSize: collapsed ? 14 : 18, fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {collapsed ? 'SKB' : 'SASS 知识平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: colorBgContainer, padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer', fontSize: 18 }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <Dropdown menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout }] }}>
            <span style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
              {realName}
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
```

- [ ] **Step 5：Check Vite 热更新**

```bash
cd sass-kb-admin && npm run dev
```
打开 http://localhost:5173/login，确认登录页渲染正常，侧边栏可折叠。

- [ ] **Step 6：Commit**

```bash
git add sass-kb-admin/
git commit -m "feat: add login page, auth store, main layout with sidebar"
```

---

#### Task 1.4.3：管理后台用户/租户管理页面

**Files:**
- Create: `sass-kb-admin/src/pages/tenant/index.tsx`
- Create: `sass-kb-admin/src/pages/user/index.tsx`
- Create: `sass-kb-admin/src/types/common.ts`
- Create: `sass-kb-admin/src/types/user.ts`

- [ ] **Step 1：写类型定义**

```typescript
// sass-kb-admin/src/types/common.ts
export interface PageResult<T> {
  records: T[];
  total: number;
  page: number;
  size: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
```

```typescript
// sass-kb-admin/src/types/user.ts
export interface User {
  id: string;
  tenantId: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  status: string;
  isSuperAdmin: boolean;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  maxUserCount: number;
  status: string;
  createdAt: string;
}
```

- [ ] **Step 2：写服务调用**

```typescript
// sass-kb-admin/src/services/authService.ts
import api from './api';
import type { PageResult, ApiResponse } from '@/types/common';
import type { User, Tenant } from '@/types/user';

export const tenantApi = {
  list: (params: { page: number; size: number; keyword?: string }) =>
    api.get<any, ApiResponse<PageResult<Tenant>>>('/tenant/list', { params }),
  create: (data: Partial<Tenant>) =>
    api.post<any, ApiResponse<Tenant>>('/tenant', data),
  update: (id: string, data: Partial<Tenant>) =>
    api.put<any, ApiResponse<void>>(`/tenant/${id}`, data),
  toggleStatus: (id: string, status: string) =>
    api.put<any, ApiResponse<void>>(`/tenant/${id}/status?status=${status}`),
};

export const userApi = {
  list: (params: { page: number; size: number; keyword?: string }) =>
    api.get<any, ApiResponse<PageResult<User>>>('/user/list', { params }),
  create: (data: Partial<User>) =>
    api.post<any, ApiResponse<User>>('/user', data),
  update: (id: string, data: Partial<User>) =>
    api.put<any, ApiResponse<void>>(`/user/${id}`, data),
  toggleStatus: (id: string, status: string) =>
    api.put<any, ApiResponse<void>>(`/user/${id}/status?status=${status}`),
  resetPassword: (id: string) =>
    api.put<any, ApiResponse<void>>(`/user/${id}/password`),
  me: () => api.get<any, ApiResponse<User>>('/user/me'),
};
```

- [ ] **Step 3：写租户管理页（Table + Modal）**

```typescript
// sass-kb-admin/src/pages/tenant/index.tsx
import { useState } from 'react';
import { Table, Button, Input, Modal, Form, Tag, Space, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/services/authService';
import type { Tenant } from '@/types/user';

export default function TenantPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', page, keyword],
    queryFn: () => tenantApi.list({ page, size: 20, keyword: keyword || undefined }),
  });

  const createMut = useMutation({
    mutationFn: (values: Partial<Tenant>) => tenantApi.create(values),
    onSuccess: () => { message.success('创建成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...values }: any) => tenantApi.update(id, values),
    onSuccess: () => { message.success('更新成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tenantApi.toggleStatus(id, status),
    onSuccess: () => { message.success('状态已更新'); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
  });

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: Tenant) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const columns = [
    { title: '租户名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contactName', key: 'contactName' },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone' },
    { title: '最大用户数', dataIndex: 'maxUserCount', key: 'maxUserCount' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Tenant) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger={record.status === 'active'}
            onClick={() => toggleMut.mutate({ id: record.id, status: record.status === 'active' ? 'disabled' : 'active' })}>
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input prefix={<SearchOutlined />} placeholder="搜索租户" style={{ width: 240 }}
          onPressEnter={(e: any) => setKeyword(e.target.value)} />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建租户</Button>
      </div>
      <Table columns={columns} dataSource={data?.data?.records || []} rowKey="id" loading={isLoading}
        pagination={{ current: page, total: data?.data?.total || 0, onChange: setPage }} />
      <Modal title={editing ? '编辑租户' : '新建租户'} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()} confirmLoading={createMut.isPending || updateMut.isPending}>
        <Form form={form} layout="vertical" onFinish={(values) => editing ? updateMut.mutate({ id: editing.id, ...values }) : createMut.mutate(values)}>
          <Form.Item name="name" label="租户名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contactName" label="联系人"><Input /></Form.Item>
          <Form.Item name="contactPhone" label="联系电话"><Input /></Form.Item>
          <Form.Item name="maxUserCount" label="最大用户数"><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 4：写用户管理页（结构同上，增加重置密码）**

用户管理页结构与租户页相似，使用 `userApi` 和 `User` 类型。字段：用户名、真实姓名、邮箱、手机号、状态。操作：编辑、启用/禁用、重置密码。此处省略完整代码——与租户页结构一致，替换 API 和字段即可。

- [ ] **Step 5：运行验证**

```bash
cd sass-kb-admin && npm run dev
```
确认：登录 → 跳转工作台 → 侧边栏切换到用户管理/租户管理 → 列表渲染。

- [ ] **Step 6：Commit**

```bash
git add sass-kb-admin/src/pages/tenant/ sass-kb-admin/src/pages/user/ sass-kb-admin/src/types/ sass-kb-admin/src/services/
git commit -m "feat: add tenant and user management pages"
```

---

### 1.5 APP 端：项目骨架 & 登录

#### Task 1.5.1：初始化 Expo 项目 & 登录

**Files:**
- Create: `sass-kb-app/` 整个项目

- [ ] **Step 1：创建 Expo 项目**

```bash
npx create-expo-app@latest sass-kb-app --template blank-typescript
cd sass-kb-app
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context zustand axios expo-secure-store @tanstack/react-query react-native-webview
```

- [ ] **Step 2：写 API 实例**

```typescript
// sass-kb-app/src/services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/authStore';

const BASE_URL = 'http://10.0.2.2:8080/api'; // Android 模拟器 → 宿主机

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refresh = await SecureStore.getItemAsync('refreshToken');
      if (refresh) {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
        const d = res.data.data;
        await SecureStore.setItemAsync('accessToken', d.accessToken);
        await SecureStore.setItemAsync('refreshToken', d.refreshToken);
        error.config.headers.Authorization = `Bearer ${d.accessToken}`;
        return api(error.config);
      }
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 3：写 authStore**

```typescript
// sass-kb-app/src/stores/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  realName: string | null;
  login: (account: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  userId: null,
  realName: null,
  login: async (account, password) => {
    const res = await fetch('http://10.0.2.2:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password }),
    });
    const json = await res.json();
    if (json.code !== 200) throw new Error(json.message);
    const d = json.data;
    await SecureStore.setItemAsync('accessToken', d.accessToken);
    await SecureStore.setItemAsync('refreshToken', d.refreshToken);
    set({ isLoggedIn: true, userId: d.userId, realName: d.realName });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ isLoggedIn: false, userId: null, realName: null });
  },
  restoreSession: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) set({ isLoggedIn: true });
  },
}));
```

- [ ] **Step 4：写登录页 + 导航**

```typescript
// sass-kb-app/src/screens/LoginScreen.tsx
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    try { await login(account, password); }
    catch (e: any) { Alert.alert('登录失败', e.message); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SASS 知识平台</Text>
      <TextInput style={styles.input} placeholder="账号" value={account} onChangeText={setAccount} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="密码" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, backgroundColor: '#f0f2f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 48, color: '#1890ff' },
  input: { height: 48, borderWidth: 1, borderColor: '#d9d9d9', borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, backgroundColor: '#fff' },
  button: { height: 48, backgroundColor: '#1890ff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 5：写 App.tsx（导航入口）**

```typescript
// sass-kb-app/src/App.tsx
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/stores/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import SpaceListScreen from '@/screens/SpaceListScreen';
import SearchScreen from '@/screens/SearchScreen';
import NotificationScreen from '@/screens/NotificationScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '工作台' }} />
      <Tab.Screen name="Spaces" component={SpaceListScreen} options={{ title: '知识库' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: '搜索' }} />
      <Tab.Screen name="Notifications" component={NotificationScreen} options={{ title: '消息' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isLoggedIn, restoreSession } = useAuthStore();

  useEffect(() => { restoreSession(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 6：验证**

```bash
cd sass-kb-app && npx expo start
```
确保登录页渲染，登录后进入底部 Tab 页面。

- [ ] **Step 7：Commit**

```bash
git add sass-kb-app/
git commit -m "feat: init Expo app with login, navigation tabs, auth store"
```

---

## Phase 2：知识库核心（空间/文件夹/文档 CRUD + 编辑器）

### 2.1 后端：空间 & 文件夹 API

#### Task 2.1.1：空间 CRUD

**Files:**
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/entity/Space.java`
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/mapper/SpaceMapper.java`
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/controller/SpaceController.java`
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/service/SpaceService.java`

**Interfaces:**
- Consumes: `TenantContext.getCurrentTenantId()`
- Produces:
  - `GET /api/space/list` → 本租户空间列表
  - `POST /api/space` → 创建空间
  - `PUT /api/space/{id}` → 编辑空间
  - `DELETE /api/space/{id}` → 删除空间（软删除）
  - `GET /api/space/{id}/tree` → 空间目录树（文件夹 + 文档）

**Implementation:**

```java
// SpaceController.java — GET /api/space/list
// 查询条件：tenant_id = 当前租户 OR tenant_id IS NULL（公共）
// 返回 Space 列表，按 sort_order ASC

// POST /api/space
// 校验 name 非空，自动设置 tenant_id = 当前租户（非公共空间时）

// GET /api/space/{id}/tree
// 返回递归树：SpaceTree { id, name, children: [FolderNode | DocNode] }
// FolderNode: { id, name, type: 'folder', children: [...] }
// DocNode: { id, title, type: 'doc', status, updatedAt }
```

#### Task 2.1.2：文件夹 CRUD + 树接口

**Files:**
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/entity/Folder.java`
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/mapper/FolderMapper.java`
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/controller/FolderController.java`

**Interfaces:**
- Produces:
  - `POST /api/folder` → 创建文件夹（space_id, parent_id 可选, name）
  - `PUT /api/folder/{id}` → 重命名
  - `DELETE /api/folder/{id}` → 删除（含子节点递归删除）
  - `PUT /api/folder/{id}/move` → 移动到目标文件夹（修改 parent_id）
  - `PUT /api/folder/sort` → 拖拽排序（批量更新 sort_order）

---

### 2.2 后端：文档 CRUD + 版本管理

#### Task 2.2.1：文档 CRUD API

**Files:**
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/entity/Document.java`
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/mapper/DocumentMapper.java`
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/controller/DocController.java`
- Create: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/service/DocService.java`

**Interfaces:**
- Produces:
  - `POST /api/doc` → 创建文档（space_id, folder_id 可选, title, content_json, content_html）
  - `GET /api/doc/{id}` → 获取文档详情（含 content_json + content_html）
  - `PUT /api/doc/{id}` → 保存文档（带 version 乐观锁检查）
  - `DELETE /api/doc/{id}` → 删除文档（软删除）
  - `PUT /api/doc/{id}/status` → 修改状态（draft/published/archived）
  - `GET /api/doc/{id}/versions` → 版本历史列表
  - `GET /api/doc/{id}/versions/{versionNumber}` → 读取指定版本内容
  - `GET /api/doc/{id}/diff?v1=3&v2=7` → 两个版本的 HTML diff

**版本保存逻辑（DocService.save）：**

```java
public Document save(String docId, DocumentSaveRequest req) {
    Document current = documentMapper.selectById(docId);
    if (current == null) throw new BizException(404, "文档不存在");

    // 乐观锁检查
    if (req.getVersion() != current.getVersion()) {
        // 返回 409，前端展示 diff
        throw new BizException(409, "版本冲突：文档已被他人修改");
    }

    // 保存旧版本
    DocumentVersion dv = new DocumentVersion();
    dv.setId(IdUtil.fastSimpleUUID());
    dv.setDocumentId(docId);
    dv.setVersionNumber(current.getVersion());
    dv.setContentJson(current.getContentJson());
    dv.setContentHtml(current.getContentHtml());
    dv.setChangeSummary(req.getChangeSummary());
    dv.setCreatedBy(req.getUpdatedBy());
    documentVersionMapper.insert(dv);

    // 更新当前版本
    current.setContentJson(req.getContentJson());
    current.setContentHtml(req.getContentHtml());
    current.setVersion(current.getVersion() + 1);
    current.setUpdatedBy(req.getUpdatedBy());
    documentMapper.updateById(current);

    // 发送 MQ 消息（异步更新 ES）
    rabbitTemplate.convertAndSend("doc.change", "doc.updated", docId);

    return current;
}
```

#### Task 2.2.2：MyBatis-Plus 租户拦截器

**Files:**
- Create: `sass-kb-server/sass-kb-tenant/src/main/java/com/sass/kb/tenant/config/MybatisPlusConfig.java`

```java
@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        TenantLineInnerInterceptor tenantInterceptor = new TenantLineInnerInterceptor();
        tenantInterceptor.setTenantLineHandler(new TenantLineHandler() {
            @Override
            public Expression getTenantId() {
                String tenantId = TenantContext.getCurrentTenantId();
                return new StringValue(tenantId != null ? tenantId : "");
            }
            @Override
            public String getTenantIdColumn() {
                return "tenant_id";
            }
            @Override
            public boolean ignoreTable(String tableName) {
                return List.of("tenant", "user").contains(tableName);
            }
        });
        interceptor.addInnerInterceptor(tenantInterceptor);
        return interceptor;
    }
}
```

---

### 2.3 管理后台：目录树 + 文档编辑器

#### Task 2.3.1：SpaceTree 组件

**Files:**
- Create: `sass-kb-admin/src/components/tree/SpaceTree.tsx`
- Create: `sass-kb-admin/src/stores/spaceStore.ts`

**Interfaces:**
- Consumes: `GET /api/space/{id}/tree`
- Produces: Ant Design Tree 组件，支持：
  - 懒加载：展开文件夹时请求子节点
  - 右键菜单：新建文件夹、新建文档、重命名、删除
  - 拖拽移动：拖拽节点到目标文件夹（调用 `PUT /api/folder/{id}/move`）
  - 点击文档节点 → 跳转到 `/doc/{docId}`

#### Task 2.3.2：Tiptap 文档编辑器

**Files:**
- Create: `sass-kb-admin/src/components/doc/DocEditor.tsx`
- Create: `sass-kb-admin/src/components/doc/DocToolbar.tsx`
- Create: `sass-kb-admin/src/components/doc/DocOutline.tsx`
- Create: `sass-kb-admin/src/pages/doc/index.tsx`

**Dependencies:**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-image @tiptap/extension-code-block @tiptap/extension-highlight @tiptap/extension-mention @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-link @tiptap/pm
```

**DocEditor 核心实现：**

```typescript
// sass-kb-admin/src/components/doc/DocEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useEffect, useCallback } from 'react';
import { useDocStore } from '@/stores/docStore';
import DocToolbar from './DocToolbar';

const lowlight = createLowlight(common);

interface Props {
  content: any;   // Tiptap JSON
  editable: boolean;
  onSave?: (json: any, html: string) => void;
}

export default function DocEditor({ content, editable, onSave }: Props) {
  const setEditor = useDocStore((s) => s.setEditor);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: '输入 "/" 唤起更多功能...' }),
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      Highlight,
      TaskList, TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onSave?.(json, html);
    },
  });

  useEffect(() => {
    if (editor) setEditor(editor);
  }, [editor, setEditor]);

  // 读模式下重新设内容
  useEffect(() => {
    if (editor && !editable && content) {
      editor.commands.setContent(content);
    }
  }, [content, editable]);

  return (
    <div className="doc-editor">
      {editable && <DocToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
```

**文档页面（DocPage）交互流程：**

```
1. 页面加载 → GET /api/doc/{id} → 解析 content_json → DocEditor 渲染
2. 用户编辑 → onUpdate 回调 → 防抖 2s 存 localStorage 草稿
3. 用户点保存 → PUT /api/doc/{id} { version, content_json, content_html }
   ├─ 200 → 提示「已保存」，更新本地 version
   └─ 409 → 弹窗展示 diff（调用 GET /api/doc/{id}/versions/{currentVersion}）
           → 用户选择：「覆盖保存」或「查看差异」
4. 切换文档 → 检查草稿 → 提示恢复
```

#### Task 2.3.3：版本历史面板

**Files:**
- Create: `sass-kb-admin/src/components/doc/VersionHistory.tsx`
- Create: `sass-kb-admin/src/components/doc/VersionDiff.tsx`

**VersionHistory**：侧边面板，调用 `GET /api/doc/{id}/versions`，渲染时间轴列表，点击查看该版本内容。

**VersionDiff**：左右分栏展示两个版本的 HTML diff（用 `diff-match-patch` 库做文本对比后高亮渲染）。

---

### 2.4 APP 端：文档浏览 & 编辑

#### Task 2.4.1：文档详情页（WebView 渲染）

**Files:**
- Create: `sass-kb-app/src/screens/DocDetailScreen.tsx`
- Create: `sass-kb-app/src/navigation/DocNavigator.tsx`

**Interfaces:**
- Consumes: `GET /api/doc/{id}` → `content_html`
- Produces: WebView 渲染 HTML，注入移动端自适应 CSS

```typescript
// DocDetailScreen.tsx 核心
const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: -apple-system, sans-serif; padding: 16px; line-height: 1.6; }
  img { max-width: 100%; height: auto; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #ddd; padding: 8px; }
  pre { background: #f5f5f5; padding: 12px; overflow-x: auto; border-radius: 6px; }
</style>
</head>
<body>${contentHtml}</body>
</html>`;

<WebView source={{ html }} style={{ flex: 1 }} />
```

#### Task 2.4.2：文档编辑页（WebView + postMessage）

**Files:**
- Create: `sass-kb-app/src/screens/DocEditScreen.tsx`

**方案：** WebView 内嵌一个独立 HTML 页面，加载 Tiptap 编辑器。通过 `postMessage` 传入初始 content_json，编辑变更后通过 `postMessage` 回调给 RN 端。

---

## Phase 3：文件 & 搜索

### 3.1 后端：MinIO 集成 + 文件 CRUD

#### Task 3.1.1：MinIO 配置 & FileService

**Files:**
- Create: `sass-kb-server/sass-kb-file/src/main/java/com/sass/kb/file/config/MinioConfig.java`
- Create: `sass-kb-server/sass-kb-file/src/main/java/com/sass/kb/file/service/FileService.java`
- Create: `sass-kb-server/sass-kb-file/src/main/java/com/sass/kb/file/controller/FileController.java`

**Interfaces:**
- Consumes: MinIO Client, `TenantContext.getCurrentTenantId()`
- Produces:
  - `POST /api/file/upload` (multipart) → 上传到 MinIO → 写入 file_asset 表 → 返回 FileAsset
  - `GET /api/file/{id}` → 获取文件信息
  - `GET /api/file/{id}/download` → 生成预签名 URL（30min）→ 302 跳转
  - `GET /api/file/{id}/preview` → Office 文件转 PDF 后返回预览 URL
  - `DELETE /api/file/{id}` → 删除 MinIO 对象 + 数据库记录
  - `GET /api/file/list` → 分页列表（space_id 过滤）

**MinIO 上传核心：**

```java
public FileAsset upload(MultipartFile file, String spaceId, String userId) {
    String tenantId = TenantContext.getCurrentTenantId();
    String objName = tenantId + "/" + IdUtil.fastSimpleUUID() + "/" + file.getOriginalFilename();

    minioClient.putObject(PutObjectArgs.builder()
        .bucket(bucketName)
        .object(objName)
        .stream(file.getInputStream(), file.getSize(), -1)
        .contentType(file.getContentType())
        .build());

    FileAsset asset = new FileAsset();
    asset.setId(IdUtil.fastSimpleUUID());
    asset.setTenantId(tenantId);
    asset.setSpaceId(spaceId);
    asset.setOriginalName(file.getOriginalFilename());
    asset.setStorePath(objName);
    asset.setFileSize(file.getSize());
    asset.setMimeType(file.getContentType());
    asset.setCreatedBy(userId);
    fileAssetMapper.insert(asset);
    return asset;
}
```

---

### 3.2 后端：Elasticsearch 集成

#### Task 3.2.1：ES 配置 + 索引初始化 + 同步消费者

**Files:**
- Create: `sass-kb-server/sass-kb-search/src/main/java/com/sass/kb/search/config/ElasticsearchConfig.java`
- Create: `sass-kb-server/sass-kb-search/src/main/java/com/sass/kb/search/model/DocDocument.java`
- Create: `sass-kb-server/sass-kb-search/src/main/java/com/sass/kb/search/consumer/DocChangeConsumer.java`
- Create: `sass-kb-server/sass-kb-search/src/main/java/com/sass/kb/search/controller/SearchController.java`
- Create: `sass-kb-server/sass-kb-search/src/main/java/com/sass/kb/search/service/SearchService.java`

**Interfaces:**
- Consumes: RabbitMQ `doc.change` 队列（来自 DocService）
- Produces:
  - `GET /api/search?q=keyword&space_id=&type=doc|file&page=1&size=20` → ES 搜索

**DocDocument（ES 索引模型）：**

```java
@Data
public class DocDocument {
    private String id;
    private String title;
    private String contentHtml;
    private String spaceId;
    private String folderId;
    private String tenantId;
    private String status;
    private String updatedBy;
    private LocalDateTime updatedAt;
    private List<String> permissionUserIds;  // 有权限查看此文档的用户 ID 列表
}
```

**ES 搜索核心逻辑：**

```java
public SearchResult search(String keyword, String spaceId, String tenantId, String userId, int page, int size) {
    NativeQuery query = NativeQuery.builder()
        .withQuery(QueryBuilders.bool()
            .must(QueryBuilders.multiMatchQuery(keyword, "title^3", "contentHtml"))
            .filter(QueryBuilders.termQuery("status", "published"))
            .filter(QueryBuilders.bool()
                .should(QueryBuilders.termQuery("tenantId", ""))   // 公共文档
                .should(QueryBuilders.termQuery("tenantId", tenantId)))
            .filter(QueryBuilders.termQuery("permissionUserIds", userId)))
        .withPageable(PageRequest.of(page - 1, size))
        .withHighlightQuery(...)
        .build();
    // 返回高亮片段 + 面包屑路径
}
```

**DocChangeConsumer：**

```java
@RabbitListener(queues = "doc.change")
public void handleDocChange(String docId) {
    Document doc = documentMapper.selectById(docId);
    if (doc == null || "deleted".equals(doc.getStatus())) {
        elasticsearchOperations.delete(docId, DocDocument.class);
    } else {
        DocDocument esDoc = toEsDocument(doc);
        elasticsearchOperations.save(esDoc);
    }
}
```

---

### 3.3 管理后台：文件管理页 + 搜索页

#### Task 3.3.1：文件管理页

**Files:**
- Create: `sass-kb-admin/src/pages/file/index.tsx`
- Create: `sass-kb-admin/src/hooks/useUpload.ts`
- Create: `sass-kb-admin/src/services/fileService.ts`

**核心交互：**
- 文件列表表格（名称、大小、类型、上传时间、上传者）
- 上传按钮 → `Upload` 组件 → `POST /api/file/upload`（multipart）
- 预览：PDF/图片用 `Modal` + `iframe`/`img` 展示
- 下载：`window.open('/api/file/{id}/download')`

#### Task 3.3.2：搜索页

**Files:**
- Create: `sass-kb-admin/src/pages/search/index.tsx`
- Create: `sass-kb-admin/src/services/searchService.ts`

**核心交互：**
- 搜索框 + 类型筛选（文档/文件）+ 空间筛选
- 结果列表：标题 + 高亮片段 + 面包屑路径
- 点击跳转 → 文档详情页或文件预览

---

### 3.4 APP 端：文件上传 & 搜索

#### Task 3.4.1：文件上传 & 预览

- `FilePreviewScreen`：WebView 渲染 PDF/图片
- `DocEditScreen` 内：图片选择 → `expo-image-picker` → `POST /api/file/upload` → 插入图片 URL

#### Task 3.4.2：搜索页

- `SearchScreen`：搜索框 + 结果 FlatList
- 点击结果 → `DocDetailScreen` 或 `FilePreviewScreen`

---

## Phase 4：权限 & 协作

### 4.1 后端：RBAC + ACL 权限引擎

#### Task 4.1.1：权限判断引擎

**Files:**
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/service/PermissionService.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/annotation/RequirePermission.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/aspect/PermissionAspect.java`

**Interfaces:**
- Produces:
  - `PermissionService.hasPermission(userId, resourceType, resourceId, action): boolean`
  - `@RequirePermission(type="doc", action="write")` — AOP 注解，拦截 Controller 方法

**权限决策流程：**

```java
public boolean hasPermission(String userId, String resourceType, String resourceId, String action) {
    // 1. 超管直接放行
    User user = userMapper.selectById(userId);
    if (user.getIsSuperAdmin()) return true;

    // 2. 查缓存
    String cacheKey = "perm:" + userId + ":" + resourceType + ":" + resourceId;
    Boolean cached = caffeineCache.getIfPresent(cacheKey);
    if (cached != null) return cached;

    // 3. 查数据库：用户角色 → 角色权限集合
    Set<String> rolePerms = getRolePermissions(userId);

    // 4. 查 ACL 规则：deny 优先
    List<PermissionRule> rules = getAclRules(userId, resourceType, resourceId);
    for (PermissionRule r : rules) {
        if ("deny".equals(r.getEffect()) && r.getAction().equals(action)) {
            caffeineCache.put(cacheKey, false);
            return false;
        }
    }
    for (PermissionRule r : rules) {
        if ("allow".equals(r.getEffect()) && r.getAction().equals(action)) {
            caffeineCache.put(cacheKey, true);
            return true;
        }
    }

    // 5. 角色权限兜底
    boolean result = rolePerms.contains(resourceType + ":" + action);
    caffeineCache.put(cacheKey, result);
    return result;
}
```

**缓存失效：** 权限变更时，通过 Redis Pub/Sub 广播 `perm:invalidate:<userId>` → 各节点清除本地 Caffeine 缓存。

#### Task 4.1.2：角色管理 API + 权限规则 API

**Files:**
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/controller/RoleController.java`
- Create: `sass-kb-server/sass-kb-auth/src/main/java/com/sass/kb/auth/controller/PermissionController.java`

**Interfaces:**
- Produces:
  - `GET/POST/PUT/DELETE /api/role` → 角色 CRUD
  - `POST /api/role/{id}/assign` → 给用户分配角色
  - `GET/POST/DELETE /api/permission/rule` → ACL 规则 CRUD
  - `GET /api/permission/check?resource=doc&resourceId=xxx&action=write` → 当前用户是否有权限

---

### 4.2 后端：评论 & 版本 Diff

#### Task 4.2.1：评论 API

**Files:**
- Create: `sass-kb-server/sass-kb-collaboration/src/main/java/com/sass/kb/collaboration/controller/CommentController.java`

**Interfaces:**
- Produces:
  - `GET /api/comment?docId=x&page=1` → 文档评论列表（树形结构）
  - `POST /api/comment` → 创建评论/回复（parent_id 可选）
  - `DELETE /api/comment/{id}` → 删除评论

#### Task 4.2.2：版本 Diff 增强

**Files:**
- Create: `sass-kb-server/sass-kb-collaboration/src/main/java/com/sass/kb/collaboration/service/DiffService.java`

```java
// DiffService — 使用 java-diff-utils
public List<DiffChunk> diffHtml(String docId, int v1, int v2) {
    String html1 = getVersionHtml(docId, v1);
    String html2 = getVersionHtml(docId, v2);
    Patch<String> patch = DiffUtils.diff(
        Arrays.asList(html1.split("\n")),
        Arrays.asList(html2.split("\n")));
    return DiffUtils.generateUnifiedDiff("v" + v1, "v" + v2,
        Arrays.asList(html1.split("\n")), patch, 3)
        .stream().map(DiffChunk::from).toList();
}
```

---

### 4.3 管理后台：权限管理界面 + 评论面板

#### Task 4.3.1：角色管理 & 权限规则页

**Files:**
- Create: `sass-kb-admin/src/pages/role/index.tsx`
- Create: `sass-kb-admin/src/components/permission/PermissionModal.tsx`

**核心交互：**
- 角色列表表格（名称、权限标签、用户数）
- 新建/编辑角色 → 选择器勾选权限项（doc:read, doc:write, file:upload, ...）
- 给用户分配角色 → 穿梭框
- 文档/文件夹右键 → 「权限设置」→ PermissionModal（ACL 规则列表 → 添加/删除）

#### Task 4.3.2：评论面板

**Files:**
- Create: `sass-kb-admin/src/components/doc/CommentList.tsx`

**核心交互：**
- DocEditor 底部可选展开的评论面板
- 评论列表（树形结构，嵌套回复）
- 输入框发评论/回复
- Tiptap @提及扩展：输入 `@` 触发用户搜索下拉

#### Task 4.3.3：usePermission Hook

```typescript
// sass-kb-admin/src/hooks/usePermission.ts
export function usePermission(
  resource: 'space' | 'folder' | 'doc' | 'file',
  resourceId: string,
  action: 'read' | 'write' | 'admin' | 'delete'
): boolean {
  const { data } = useQuery({
    queryKey: ['permission', resource, resourceId, action],
    queryFn: () => permissionApi.check(resource, resourceId, action),
    staleTime: 60_000,
  });
  return data?.data === true;
}
```

---

### 4.4 APP 端：权限 & 评论

- `usePermission` hook 同 Web 端结构
- `CommentList` 组件：FlatList 渲染评论树
- 权限控制 UI 显隐（编辑按钮、删除按钮根据权限显示/隐藏）

---

## Phase 5：公共文库 & 通知

### 5.1 后端：公共空间 & 通知服务

#### Task 5.1.1：公共文库支持

**Files:**
- 修改: `sass-kb-server/sass-kb-doc/src/main/java/com/sass/kb/doc/controller/SpaceController.java`

**逻辑：**
- 公共空间（`type = 'public'`）对全部已登录用户可见
- 公共空间下的文档，`tenant_id = NULL`，默认只读
- 超管可发布文档到公共空间
- 租户用户可将公共文档「复制到私有空间」

#### Task 5.1.2：通知服务

**Files:**
- Create: `sass-kb-server/sass-kb-notification/src/main/java/com/sass/kb/notification/entity/Notification.java`
- Create: `sass-kb-server/sass-kb-notification/src/main/java/com/sass/kb/notification/consumer/NotificationConsumer.java`
- Create: `sass-kb-server/sass-kb-notification/src/main/java/com/sass/kb/notification/controller/NotificationController.java`

**Interfaces:**
- Produces:
  - `GET /api/notification/list` → 当前用户的通知列表
  - `PUT /api/notification/{id}/read` → 标记已读
  - `GET /api/notification/unread-count` → 未读数

**触发来源：**
- 文档被评论 → 通知文档作者
- 被 @提及 → 通知被 @的用户
- 权限变更 → 通知相关用户

#### Task 5.1.3：审计日志

**Files:**
- Create: `sass-kb-server/sass-kb-common/src/main/java/com/sass/kb/common/aspect/AuditAspect.java`
- Create: `sass-kb-server/sass-kb-common/src/main/java/com/sass/kb/common/entity/AuditLog.java`

**实现：** AOP 切面 `@AuditLog(action="DELETE_DOC", target="#docId")` → 自动记录操作人、时间、IP、操作类型、目标 ID。

---

### 5.2 管理后台 & APP：消息中心 & 审计

#### Task 5.2.1：管理后台：通知中心 + 审计日志页

- **通知中心：** 顶栏铃铛图标 + 未读红点 + 下拉列表
- **审计日志：** `AuditPage` → Table 展示操作记录（时间、用户、操作、目标、IP），只读，支持筛选

#### Task 5.2.2：APP 端：消息中心

- `NotificationScreen`：未读通知列表，点击跳转目标文档
- 底部 Tab 消息图标显示未读红点

---

## Phase 6：打磨 & 上线

### 6.1 性能优化

| 优化项 | 说明 |
|--------|------|
| 文档列表分页 | 后端 MyBatis-Plus Page + 前端 TanStack Query 缓存 |
| 权限缓存 | Caffeine（本地 TTL 5min）+ Redis（远程 TTL 30min），两级缓存 |
| ES 查询优化 | 只返回必要字段（_source filtering），search_after 深度分页 |
| 富文本图片 | 图片上传后压缩 + CDN 加速（MinIO + Nginx 反代） |
| 前端包体积 | Vite code splitting，Ant Design 按需导入，Tiptap 扩展按需加载 |
| APP 首屏 | Expo Splash Screen + lazy loading screens |

### 6.2 安全加固

| 加固项 | 说明 |
|--------|------|
| XSS 防护 | Tiptap JSON → HTML 服务端消毒（OWASP Java HTML Sanitizer） |
| SQL 注入 | MyBatis-Plus 参数化查询（`#{}`） |
| CSRF | JWT Bearer Token，不依赖 Cookie |
| 密码策略 | BCrypt 加密 + 最小长度 8 位 |
| 文件上传 | 白名单校验 MIME 类型 + 大小限制 50MB |
| API 限流 | Spring Cloud Gateway / Nginx rate limiting |

### 6.3 CI/CD

```
Git Push → GitHub Actions / Jenkins
  ├─ Backend: mvn test → mvn package → Docker build → push registry
  ├─ Admin: npm test → npm run build → Docker build (nginx) → push registry
  └─ APP: npx expo build / EAS Build → 发布到 TestFlight / APK
```

### 6.4 监控

- **后端：** Spring Boot Actuator + Prometheus + Grafana（JVM、API 响应时间、错误率）
- **中间件：** PostgreSQL、Redis、RabbitMQ、ES 的健康检查和告警
- **前端：** Sentry 错误追踪（Web + APP）

---

## 附录：项目仓库总结构

```
SASS知识平台管理/
├── sass-kb-server/          # Java 后端
│   ├── pom.xml              # 父 POM
│   ├── sass-kb-common/      # 公共模块
│   ├── sass-kb-tenant/      # 租户模块
│   ├── sass-kb-auth/        # 认证授权模块
│   ├── sass-kb-doc/         # 文档模块
│   ├── sass-kb-file/        # 文件模块
│   ├── sass-kb-search/      # 搜索模块
│   ├── sass-kb-collaboration/ # 协作模块
│   ├── sass-kb-notification/  # 通知模块
│   └── sass-kb-web/         # 启动模块
├── sass-kb-admin/           # React 管理后台
├── sass-kb-app/             # React Native APP
├── docs/
│   └── superpowers/
│       ├── specs/           # 设计文档
│       └── plans/           # 实施计划
└── docker-compose.yml       # 本地开发中间件
```

**docker-compose.yml（本地开发环境）：**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: sass_kb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ['5432:5432']
    volumes: ['pgdata:/var/lib/postgresql/data']
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      discovery.type: single-node
      xpack.security.enabled: false
    ports: ['9200:9200']
    volumes: ['esdata:/usr/share/elasticsearch/data']
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ['9000:9000', '9001:9001']
    volumes: ['miniodata:/data']
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports: ['5672:5672', '15672:15672']
volumes:
  pgdata: ~
  esdata: ~
  miniodata: ~
```

---

## 附录 B：Phase 1 关键 API 汇总

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录 | 否 |
| POST | `/api/auth/refresh` | 刷新 Token | 否 |
| GET | `/api/tenant/list` | 租户列表 | 超管 |
| POST | `/api/tenant` | 新建租户 | 超管 |
| PUT | `/api/tenant/{id}` | 编辑租户 | 超管 |
| PUT | `/api/tenant/{id}/status` | 启/禁租户 | 超管 |
| GET | `/api/user/list` | 用户列表 | JWT |
| POST | `/api/user` | 新建用户 | JWT |
| PUT | `/api/user/{id}` | 编辑用户 | JWT |
| PUT | `/api/user/{id}/status` | 启/禁用户 | JWT |
| PUT | `/api/user/{id}/password` | 重置密码 | JWT |
| GET | `/api/user/me` | 当前用户信息 | JWT |
