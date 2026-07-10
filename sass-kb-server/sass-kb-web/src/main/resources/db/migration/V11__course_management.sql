-- V11: 课程管理系统 — 课程/分类/章节/课时/讲师
CREATE TABLE IF NOT EXISTS teacher (
    id          VARCHAR(32)  PRIMARY KEY,
    teacher_name VARCHAR(200) NOT NULL,
    avatar      VARCHAR(255),
    title       VARCHAR(100),
    intro       TEXT,
    sort        INT          DEFAULT 0,
    status      INT          DEFAULT 1,
    tenant_id   VARCHAR(32),
    created_at  TIMESTAMP    DEFAULT now(),
    updated_at  TIMESTAMP    DEFAULT now(),
    deleted     INT          DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_teacher_tenant ON teacher(tenant_id);

CREATE TABLE IF NOT EXISTS course_category (
    id          VARCHAR(32)  PRIMARY KEY,
    cat_name    VARCHAR(200) NOT NULL,
    parent_id   VARCHAR(32)  DEFAULT NULL,
    sort        INT          DEFAULT 0,
    status      INT          DEFAULT 1,
    tenant_id   VARCHAR(32),
    created_at  TIMESTAMP    DEFAULT now(),
    updated_at  TIMESTAMP    DEFAULT now(),
    deleted     INT          DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cat_parent ON course_category(parent_id);
CREATE INDEX IF NOT EXISTS idx_cat_tenant ON course_category(tenant_id);

CREATE TABLE IF NOT EXISTS course (
    id             VARCHAR(32)  PRIMARY KEY,
    course_name    VARCHAR(200) NOT NULL,
    category_id    VARCHAR(32),
    teacher_id     VARCHAR(32),
    cover          VARCHAR(255),
    introduce      TEXT,
    total_chapter  INT          DEFAULT 0,
    total_duration INT          DEFAULT 0,
    original_price INT          DEFAULT 0,
    current_price  INT          DEFAULT 0,
    student_count  INT          DEFAULT 0,
    difficulty     INT          DEFAULT 1,
    status         INT          DEFAULT 0,
    sort           INT          DEFAULT 0,
    tenant_id      VARCHAR(32),
    created_at     TIMESTAMP    DEFAULT now(),
    updated_at     TIMESTAMP    DEFAULT now(),
    deleted        INT          DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_course_tenant ON course(tenant_id);
CREATE INDEX IF NOT EXISTS idx_course_category ON course(category_id);
CREATE INDEX IF NOT EXISTS idx_course_teacher ON course(teacher_id);

CREATE TABLE IF NOT EXISTS course_chapter (
    id           VARCHAR(32)  PRIMARY KEY,
    course_id    VARCHAR(32)  NOT NULL,
    chapter_name VARCHAR(200) NOT NULL,
    chapter_desc TEXT,
    period_count INT          DEFAULT 0,
    sort         INT          DEFAULT 0,
    tenant_id    VARCHAR(32),
    created_at   TIMESTAMP    DEFAULT now(),
    updated_at   TIMESTAMP    DEFAULT now(),
    deleted      INT          DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_chapter_course ON course_chapter(course_id);
CREATE INDEX IF NOT EXISTS idx_chapter_tenant ON course_chapter(tenant_id);

CREATE TABLE IF NOT EXISTS course_period (
    id           VARCHAR(32)  PRIMARY KEY,
    course_id    VARCHAR(32)  NOT NULL,
    chapter_id   VARCHAR(32)  NOT NULL,
    period_name  VARCHAR(200) NOT NULL,
    period_desc  TEXT,
    period_type  INT          DEFAULT 1,
    duration     INT          DEFAULT 0,
    resource_url VARCHAR(500),
    is_free      INT          DEFAULT 0,
    sort         INT          DEFAULT 0,
    tenant_id    VARCHAR(32),
    created_at   TIMESTAMP    DEFAULT now(),
    updated_at   TIMESTAMP    DEFAULT now(),
    deleted      INT          DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_period_course ON course_period(course_id);
CREATE INDEX IF NOT EXISTS idx_period_chapter ON course_period(chapter_id);
CREATE INDEX IF NOT EXISTS idx_period_tenant ON course_period(tenant_id);
