-- V1__init_tables.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

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
    updated_at      TIMESTAMP DEFAULT now(),
    deleted         INT DEFAULT 0
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
