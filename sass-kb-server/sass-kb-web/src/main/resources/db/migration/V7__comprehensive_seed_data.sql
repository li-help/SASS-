-- V7__comprehensive_seed_data.sql
-- 为所有业务表插入5-6条正规种子数据

-- ============================================================
-- 1. 租户表 (tenant) - 新增5条
-- ============================================================
INSERT INTO tenant (id, name, logo_url, contact_name, contact_phone, max_user_count, status, created_at, updated_at) VALUES
('tn-techcorp',  '星辰科技有限公司', 'https://cdn.example.com/logo/techcorp.png',  '陈建国', '13900001101', 200, 'active', now(), now()),
('tn-eduonline', '慧学在线教育平台', 'https://cdn.example.com/logo/eduonline.png', '李明慧', '13900001102', 500, 'active', now(), now()),
('tn-healthcld', '仁康医疗健康云',   'https://cdn.example.com/logo/healthcld.png', '王仁康', '13900001103', 300, 'active', now(), now()),
('tn-fintech',   '鑫汇金融科技有限公司','https://cdn.example.com/logo/fintech.png',   '赵鑫海', '13900001104', 150, 'active', now(), now()),
('tn-legalsvc',  '正和法律咨询服务',   'https://cdn.example.com/logo/legalsvc.png',  '周正和', '13900001105', 100, 'active', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. 用户表 (user) - 新增6条 (5个普通用户 + 1个租户管理员)
-- 密码均为 123456
-- ============================================================
INSERT INTO "user" (id, tenant_id, username, password_hash, real_name, email, phone, avatar_url, status, is_super_admin, created_at, updated_at) VALUES
('u-zhangsan',   'system-tenant', 'zhangsan',   '$2a$10$8hiTSgKFn5ZSSLmA.3efWO16f4X.AtpLP5Oax/3FX5Tl9EupLHl/q', '张三',   'zhangsan@system.com',   '13800000001', NULL, 'active', false, now(), now()),
('u-lisi',       'system-tenant', 'lisi',       '$2a$10$8hiTSgKFn5ZSSLmA.3efWO16f4X.AtpLP5Oax/3FX5Tl9EupLHl/q', '李四',   'lisi@system.com',       '13800000002', NULL, 'active', false, now(), now()),
('u-wangwu',     'system-tenant', 'wangwu',     '$2a$10$8hiTSgKFn5ZSSLmA.3efWO16f4X.AtpLP5Oax/3FX5Tl9EupLHl/q', '王五',   'wangwu@system.com',     '13800000003', NULL, 'active', false, now(), now()),
('u-zhaoliu',    'system-tenant', 'zhaoliu',    '$2a$10$8hiTSgKFn5ZSSLmA.3efWO16f4X.AtpLP5Oax/3FX5Tl9EupLHl/q', '赵六',   'zhaoliu@system.com',    '13800000004', NULL, 'active', false, now(), now()),
('u-sunqi',      'system-tenant', 'sunqi',      '$2a$10$8hiTSgKFn5ZSSLmA.3efWO16f4X.AtpLP5Oax/3FX5Tl9EupLHl/q', '孙七',   'sunqi@system.com',      '13800000005', NULL, 'active', false, now(), now()),
('u-tech-admin', 'tn-techcorp',   'techadmin',  '$2a$10$8hiTSgKFn5ZSSLmA.3efWO16f4X.AtpLP5Oax/3FX5Tl9EupLHl/q', '陈建国', 'chenjg@techcorp.com',   '13900001101', NULL, 'active', false, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. 知识空间表 (space) - 新增6条
-- ============================================================
INSERT INTO space (id, tenant_id, name, description, icon, type, sort_order, created_by, created_at, updated_at) VALUES
('sp-product',    'system-tenant', '产品研发知识库', '产品需求文档、技术方案、API设计规范等',       'icon-product',   'public',  1, 'admin-user-id', now(), now()),
('sp-operation',  'system-tenant', '运维手册',       '服务器部署、监控告警、应急预案操作手册',       'icon-ops',       'private', 2, 'admin-user-id', now(), now()),
('sp-hr-policy',  'system-tenant', '人事管理制度',   '员工手册、考勤制度、绩效考核、培训资料',       'icon-hr',        'private', 3, 'admin-user-id', now(), now()),
('sp-marketing',  'system-tenant', '市场营销资料',   '品牌VI规范、推广文案、竞品分析报告',           'icon-marketing', 'public',  4, 'u-zhangsan',    now(), now()),
('sp-finance',    'system-tenant', '财务管理规范',   '报销流程、预算管理、财务报表模板',             'icon-finance',   'private', 5, 'u-lisi',        now(), now()),
('sp-tech-doc',   'tn-techcorp',   '技术文档中心',   '星辰科技内部技术文档、架构设计、代码规范',     'icon-tech',      'private', 1, 'u-tech-admin',  now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. 文件夹表 (folder) - 新增6条
-- ============================================================
INSERT INTO folder (id, space_id, parent_id, name, sort_order, created_by, created_at, updated_at) VALUES
('fd-requirement',  'sp-product',   NULL,              '需求文档',       1, 'admin-user-id', now(), now()),
('fd-tech-design',  'sp-product',   NULL,              '技术方案',       2, 'admin-user-id', now(), now()),
('fd-api-doc',      'sp-product',   'fd-tech-design',  'API接口文档',   1, 'admin-user-id', now(), now()),
('fd-deploy',       'sp-operation', NULL,              '部署方案',       1, 'admin-user-id', now(), now()),
('fd-monitor',      'sp-operation', NULL,              '监控告警',       2, 'admin-user-id', now(), now()),
('fd-staff-handbook','sp-hr-policy', NULL,             '员工手册',       1, 'u-zhangsan',    now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. 文档表 (document) - 新增6条
-- ============================================================
INSERT INTO document (id, space_id, folder_id, tenant_id, title, content_json, content_html, status, version, created_by, updated_by, created_at, updated_at, deleted) VALUES
('doc-prd-login',   'sp-product',  'fd-requirement', 'system-tenant', '用户登录模块PRD',         '{"type":"doc","content":[{"type":"heading","text":"登录需求概述"}]}',  '<h2>登录需求概述</h2><p>用户通过账号密码或手机验证码登录系统。</p>',       'published', 2, 'admin-user-id', 'admin-user-id', now(), now(), 0),
('doc-api-auth',    'sp-product',  'fd-api-doc',      'system-tenant', '认证服务API文档',         '{"type":"doc","content":[{"type":"heading","text":"认证接口"}]}',      '<h2>认证接口</h2><p>包括登录、登出、Token刷新、密码重置等接口。</p>',        'published', 1, 'admin-user-id', 'admin-user-id', now(), now(), 0),
('doc-deploy-nginx','sp-operation','fd-deploy',       'system-tenant', 'Nginx反向代理部署指南',   '{"type":"doc","content":[{"type":"heading","text":"Nginx配置"}]}',      '<h2>Nginx配置</h2><p>包括SSL证书配置、负载均衡策略、静态资源缓存。</p>',  'published', 3, 'u-wangwu',      'u-wangwu',      now(), now(), 0),
('doc-monitor-alert','sp-operation','fd-monitor',     'system-tenant', 'Prometheus告警规则配置',  '{"type":"doc","content":[{"type":"heading","text":"告警规则"}]}',        '<h2>告警规则</h2><p>CPU、内存、磁盘使用率告警阈值及通知渠道配置。</p>',   'draft',     1, 'u-wangwu',      'u-wangwu',      now(), now(), 0),
('doc-employee-hb',  'sp-hr-policy','fd-staff-handbook','system-tenant','员工手册（2025版）',      '{"type":"doc","content":[{"type":"heading","text":"公司简介"}]}',        '<h2>公司简介</h2><p>包含企业文化、行为准则、福利待遇等章节。</p>',       'published', 1, 'u-zhangsan',    'u-zhangsan',    now(), now(), 0),
('doc-marketing-vi', 'sp-marketing', NULL,             'system-tenant', '品牌VI视觉规范',          '{"type":"doc","content":[{"type":"heading","text":"品牌色彩"}]}',        '<h2>品牌色彩</h2><p>主色、辅色、字体、Logo使用规范及禁例。</p>',         'published', 1, 'u-zhangsan',    'u-zhangsan',    now(), now(), 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. 文档版本表 (document_version) - 新增6条
-- ============================================================
INSERT INTO document_version (id, document_id, version_number, content_json, content_html, change_summary, created_by, created_at) VALUES
('dv-login-v1',    'doc-prd-login',    1, '{"type":"doc","content":[{"type":"heading","text":"登录需求v1"}]}',  '<h2>登录需求v1</h2><p>初版：仅支持账号密码登录。</p>',                    '初始创建',           'admin-user-id', now() - interval '7 days'),
('dv-login-v2',    'doc-prd-login',    2, '{"type":"doc","content":[{"type":"heading","text":"登录需求v2"}]}',  '<h2>登录需求v2</h2><p>新增短信验证码登录方式。</p>',                    '新增短信验证码登录', 'admin-user-id', now()),
('dv-nginx-v1',    'doc-deploy-nginx', 1, '{"type":"doc","content":[{"type":"heading","text":"Nginx v1"}]}',   '<h2>Nginx v1</h2><p>初版：基础反向代理配置。</p>',                      '初始创建',           'u-wangwu',      now() - interval '30 days'),
('dv-nginx-v2',    'doc-deploy-nginx', 2, '{"type":"doc","content":[{"type":"heading","text":"Nginx v2"}]}',   '<h2>Nginx v2</h2><p>增加SSL证书自动续期配置。</p>',                    '新增SSL自动续期',    'u-wangwu',      now() - interval '14 days'),
('dv-nginx-v3',    'doc-deploy-nginx', 3, '{"type":"doc","content":[{"type":"heading","text":"Nginx v3"}]}',   '<h2>Nginx v3</h2><p>增加WebSocket代理及负载均衡策略。</p>',           '新增WebSocket支持',  'u-wangwu',      now()),
('dv-api-auth-v1', 'doc-api-auth',     1, '{"type":"doc","content":[{"type":"heading","text":"认证API v1"}]}', '<h2>认证API v1</h2><p>JWT认证、接口鉴权、权限模型说明。</p>',          '初始创建',           'admin-user-id', now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. 评论表 (comment) - 新增6条
-- ============================================================
INSERT INTO comment (id, document_id, parent_id, content, created_by, created_at, updated_at) VALUES
('cmt-001', 'doc-prd-login',    NULL,         '登录模块是否考虑接入企业微信SSO单点登录？',       'u-lisi',        now() - interval '2 days',  now() - interval '2 days'),
('cmt-002', 'doc-prd-login',    'cmt-001',    '已列入下一期迭代计划，预计Q3上线。',             'admin-user-id', now() - interval '1 day',   now() - interval '1 day'),
('cmt-003', 'doc-deploy-nginx', NULL,         '建议补充HTTP/2和HTTP/3的配置示例。',             'u-sunqi',       now() - interval '5 days',  now() - interval '5 days'),
('cmt-004', 'doc-deploy-nginx', 'cmt-003',    '收到，本周内补充完整。',                         'u-wangwu',      now() - interval '4 days',  now() - interval '4 days'),
('cmt-005', 'doc-api-auth',     NULL,         'Token刷新机制中refresh_token的过期策略需要明确。','u-zhangsan',    now() - interval '3 days',  now() - interval '3 days'),
('cmt-006', 'doc-employee-hb',  NULL,         '建议增加远程办公相关条款，适应混合办公趋势。',   'u-zhaoliu',     now() - interval '6 days',  now() - interval '6 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. 文件资产表 (file_asset) - 新增6条
-- ============================================================
INSERT INTO file_asset (id, tenant_id, space_id, original_name, store_path, file_size, mime_type, created_by, created_at) VALUES
('fa-001', 'system-tenant', 'sp-product',   '登录流程原型图.png',           'uploads/2025/06/prototype-login.png',           2048000,  'image/png',              'admin-user-id', now() - interval '30 days'),
('fa-002', 'system-tenant', 'sp-product',   '系统架构设计图.vsd',           'uploads/2025/06/architecture.vsdx',             5120000,  'application/vnd.visio',  'admin-user-id', now() - interval '28 days'),
('fa-003', 'system-tenant', 'sp-operation', '服务器拓扑图.png',             'uploads/2025/06/server-topology.png',           1536000,  'image/png',              'u-wangwu',      now() - interval '20 days'),
('fa-004', 'system-tenant', 'sp-marketing', '品牌Logo源文件.zip',           'uploads/2025/06/brand-logo-source.zip',        10240000,  'application/zip',        'u-zhangsan',    now() - interval '15 days'),
('fa-005', 'system-tenant', 'sp-hr-policy', '绩效考核表模板.xlsx',          'uploads/2025/06/performance-template.xlsx',     512000,   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'u-lisi', now() - interval '10 days'),
('fa-006', 'system-tenant', 'sp-finance',   '2025年度预算报表.pdf',         'uploads/2025/06/budget-2025.pdf',              3145728,   'application/pdf',        'u-lisi',        now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. 角色表 (role) - 新增6条
-- ============================================================
INSERT INTO role (id, tenant_id, name, description, permissions, parent_id, created_at, updated_at) VALUES
('role-space-admin', 'system-tenant', '空间管理员',   '管理指定知识空间的所有内容与成员权限',     '["space:read","space:write","doc:read","doc:write","doc:delete","member:manage"]'::jsonb, NULL,                now(), now()),
('role-editor',      'system-tenant', '编辑者',       '可创建和编辑文档，但不能删除',             '["space:read","doc:read","doc:write"]'::jsonb,                                         NULL,                now(), now()),
('role-viewer',      'system-tenant', '只读用户',     '仅可查看已发布的文档内容',                 '["space:read","doc:read"]'::jsonb,                                                     NULL,                now(), now()),
('role-guest',       'system-tenant', '访客',         '受限访问，仅可查看公开空间',               '["space:read"]'::jsonb,                                                               NULL,                now(), now()),
('role-senior-edit', 'system-tenant', '高级编辑者',   '除编辑权限外，可管理评论和文件资产',       '["space:read","doc:read","doc:write","comment:manage","file:upload"]'::jsonb,           'role-editor',       now(), now()),
('role-dept-head',   'system-tenant', '部门负责人',   '部门级管理员，可审批文档发布',             '["space:read","space:write","doc:read","doc:write","doc:review","member:manage"]'::jsonb, 'role-space-admin', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. 权限规则表 (permission_rule) - 新增6条
-- ============================================================
INSERT INTO permission_rule (id, tenant_id, subject_type, subject_id, target_type, target_id, action, effect) VALUES
('perm-001', 'system-tenant', 'role', 'role-editor',      'space', 'sp-product',   'write',  'allow'),
('perm-002', 'system-tenant', 'role', 'role-editor',      'space', 'sp-marketing', 'write',  'allow'),
('perm-003', 'system-tenant', 'role', 'role-viewer',      'space', 'sp-product',   'read',   'allow'),
('perm-004', 'system-tenant', 'role', 'role-viewer',      'space', 'sp-operation', 'read',   'allow'),
('perm-005', 'system-tenant', 'user', 'u-zhangsan',       'space', 'sp-marketing', 'admin',  'allow'),
('perm-006', 'system-tenant', 'role', 'role-viewer',      'space', 'sp-finance',   'read',   'deny')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. 通知表 (notification) - 新增6条
-- ============================================================
INSERT INTO notification (id, tenant_id, user_id, type, title, content, target_type, target_id, is_read, created_at) VALUES
('notif-001', 'system-tenant', 'u-zhangsan',    'comment',   '你的文档收到新评论',   '李四 评论了《品牌VI视觉规范》',                      'doc',   'doc-marketing-vi', false, now() - interval '1 hour'),
('notif-002', 'system-tenant', 'u-wangwu',      'comment',   '你的文档收到新回复',   '孙七 回复了《Prometheus告警规则配置》的评论',       'doc',   'doc-monitor-alert',false, now() - interval '3 hours'),
('notif-003', 'system-tenant', 'admin-user-id', 'mention',   '有人在评论中@了你',    '张三 在《员工手册（2025版）》评论中提到了你',       'doc',   'doc-employee-hb',  true,  now() - interval '1 day'),
('notif-004', 'system-tenant', 'u-lisi',        'permission','权限变更通知',         '你已被授予「财务管理规范」空间的读取权限',          'space',  'sp-finance',       false, now() - interval '2 days'),
('notif-005', 'system-tenant', 'u-sunqi',       'comment',   '你关注的文档有更新',   '王五 更新了《Nginx反向代理部署指南》（版本v3）',    'doc',   'doc-deploy-nginx', true,  now() - interval '3 days'),
('notif-006', 'system-tenant', 'u-zhaoliu',     'mention',   '文档协作邀请',         '张三 邀请你协作编辑《品牌VI视觉规范》',             'doc',   'doc-marketing-vi', false, now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. 审计日志表 (audit_log) - 新增6条
-- ============================================================
INSERT INTO audit_log (id, tenant_id, user_id, username, action, target_type, target_id, detail, ip_address, created_at) VALUES
('audit-001', 'system-tenant', 'admin-user-id', 'admin',    'CREATE_SPACE',   'space',   'sp-product',     '创建知识空间「产品研发知识库」',                '192.168.1.100',  now() - interval '30 days'),
('audit-002', 'system-tenant', 'admin-user-id', 'admin',    'CREATE_DOC',     'doc',     'doc-prd-login',  '创建文档「用户登录模块PRD」',                    '192.168.1.100',  now() - interval '30 days'),
('audit-003', 'system-tenant', 'u-wangwu',      'wangwu',   'UPDATE_DOC',     'doc',     'doc-deploy-nginx','更新文档「Nginx反向代理部署指南」至版本v3',     '10.0.0.55',      now() - interval '14 days'),
('audit-004', 'system-tenant', 'u-zhangsan',    'zhangsan', 'CREATE_DOC',     'doc',     'doc-marketing-vi','创建文档「品牌VI视觉规范」',                    '10.0.0.88',      now() - interval '10 days'),
('audit-005', 'system-tenant', 'admin-user-id', 'admin',    'GRANT_ROLE',     'user',    'u-lisi',         '为用户「李四」分配角色「只读用户」',            '192.168.1.100',  now() - interval '2 days'),
('audit-006', 'system-tenant', 'u-lisi',        'lisi',     'COMMENT',        'doc',     'doc-prd-login',  '在文档「用户登录模块PRD」发表评论',             '10.0.0.72',      now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;
