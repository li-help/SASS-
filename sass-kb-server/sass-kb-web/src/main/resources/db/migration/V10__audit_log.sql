-- V10: 操作审计日志表
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(32) PRIMARY KEY,
    tenant_id VARCHAR(32),
    user_id VARCHAR(32),
    username VARCHAR(64),
    action VARCHAR(32) NOT NULL COMMENT 'CREATED/UPDATED/DELETED',
    target_type VARCHAR(32) NOT NULL COMMENT 'FILE/ROLE/USER/TENANT/MENU/DOC/SPACE',
    target_id VARCHAR(32),
    detail VARCHAR(500) COMMENT '操作描述',
    ip VARCHAR(64),
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_time ON audit_log(created_at);
