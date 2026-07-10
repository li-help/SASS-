-- V12: 课程管理菜单
-- 菜单目录
INSERT INTO menu (id, tenant_id, parent_id, name, menu_type, path, icon, sort_order, visible, status, created_at, updated_at)
VALUES ('menu-course-catalog', 'system-tenant', NULL, '课程管理', 'M', '/course', 'BookOutlined', 90, true, '0', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 课程列表
INSERT INTO menu (id, tenant_id, parent_id, name, menu_type, path, icon, sort_order, visible, status, created_at, updated_at)
VALUES ('menu-course-list', 'system-tenant', 'menu-course-catalog', '课程列表', 'C', 'course', 'ReadOutlined', 1, true, '0', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 课程分类
INSERT INTO menu (id, tenant_id, parent_id, name, menu_type, path, icon, sort_order, visible, status, created_at, updated_at)
VALUES ('menu-course-category', 'system-tenant', 'menu-course-catalog', '课程分类', 'C', 'course-category', 'ApartmentOutlined', 2, true, '0', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 章节管理
INSERT INTO menu (id, tenant_id, parent_id, name, menu_type, path, icon, sort_order, visible, status, created_at, updated_at)
VALUES ('menu-course-chapter', 'system-tenant', 'menu-course-catalog', '章节管理', 'C', 'course-chapter', 'BarsOutlined', 3, true, '0', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 讲师管理
INSERT INTO menu (id, tenant_id, parent_id, name, menu_type, path, icon, sort_order, visible, status, created_at, updated_at)
VALUES ('menu-course-teacher', 'system-tenant', 'menu-course-catalog', '讲师管理', 'C', 'teacher', 'UserOutlined', 4, true, '0', now(), now())
ON CONFLICT (id) DO NOTHING;
