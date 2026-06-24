-- V6__role_permissions_json.sql
-- 将 role 表的 permissions 字段从 TEXT[] 转换为 JSONB，以便更好地与 JacksonTypeHandler 兼容

-- 先添加临时列
ALTER TABLE role ADD COLUMN permissions_json JSONB;

-- 将现有数据迁移
UPDATE role 
SET permissions_json = 
    CASE 
        WHEN permissions IS NOT NULL AND array_length(permissions, 1) > 0 
        THEN to_jsonb(permissions) 
        ELSE '[]'::jsonb 
    END;

-- 确保即使是 null 也设置为空数组
UPDATE role SET permissions_json = '[]'::jsonb WHERE permissions_json IS NULL;

-- 删除旧列
ALTER TABLE role DROP COLUMN permissions;

-- 重命名新列
ALTER TABLE role RENAME COLUMN permissions_json TO permissions;

-- 设置默认值
ALTER TABLE role ALTER COLUMN permissions SET DEFAULT '[]'::jsonb;
