-- V8: 菜单管理
CREATE TABLE menu (
    id         VARCHAR(32)  PRIMARY KEY,
    tenant_id  VARCHAR(32)  NOT NULL,
    parent_id  VARCHAR(32),
    name       VARCHAR(50)  NOT NULL,
    menu_type  VARCHAR(1)   NOT NULL DEFAULT 'M',
    path       VARCHAR(200),
    component  VARCHAR(200),
    perms      VARCHAR(100),
    icon       VARCHAR(50),
    sort_order INT          DEFAULT 0,
    visible    BOOLEAN      DEFAULT true,
    status     VARCHAR(1)   DEFAULT '0',
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_tenant ON menu(tenant_id);
CREATE INDEX idx_menu_parent ON menu(parent_id);
