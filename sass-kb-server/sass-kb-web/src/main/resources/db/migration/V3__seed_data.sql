-- V3__seed_data.sql

-- 插入默认系统租户 (system-tenant)
INSERT INTO tenant (id, name, logo_url, contact_name, contact_phone, max_user_count, status, created_at, updated_at)
VALUES ('system-tenant', '系统默认租户', NULL, '管理员', '13800000000', 100, 'active', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 插入默认系统管理员 (用户名: admin, 密码: 123456)
INSERT INTO "user" (id, tenant_id, username, password_hash, real_name, email, phone, avatar_url, status, is_super_admin, created_at, updated_at)
VALUES ('admin-user-id', 'system-tenant', 'admin', '$2a$10$8hiTSgKFn5ZSSLmA.3efWO16f4X.AtpLP5Oax/3FX5Tl9EupLHl/q', '系统管理员', 'admin@system.com', '13800000000', NULL, 'active', true, now(), now())
ON CONFLICT (id) DO NOTHING;
