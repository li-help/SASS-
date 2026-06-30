-- V7: 商家入驻申请表
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
    created_at      TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ma_credit_code ON merchant_application(credit_code);
CREATE INDEX idx_ma_status ON merchant_application(status);

-- tenant 表添加来源字段
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';
