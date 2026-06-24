-- V2: notification and audit_log tables
CREATE TABLE notification (
    id              VARCHAR(32) PRIMARY KEY,
    tenant_id       VARCHAR(32),
    user_id         VARCHAR(32) NOT NULL REFERENCES "user"(id),
    type            VARCHAR(30) NOT NULL,    -- comment | mention | permission
    title           VARCHAR(200) NOT NULL,
    content         TEXT,
    target_type     VARCHAR(20),             -- doc | space | file
    target_id       VARCHAR(32),
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_notif_user ON notification(user_id);
CREATE INDEX idx_notif_tenant ON notification(tenant_id);
CREATE INDEX idx_notif_unread ON notification(user_id, is_read);

CREATE TABLE audit_log (
    id              VARCHAR(32) PRIMARY KEY,
    tenant_id       VARCHAR(32),
    user_id         VARCHAR(32),
    username        VARCHAR(100),
    action          VARCHAR(50) NOT NULL,    -- CREATE_DOC, DELETE_SPACE, etc.
    target_type     VARCHAR(30),
    target_id       VARCHAR(32),
    detail          TEXT,
    ip_address      VARCHAR(50),
    created_at      TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);
