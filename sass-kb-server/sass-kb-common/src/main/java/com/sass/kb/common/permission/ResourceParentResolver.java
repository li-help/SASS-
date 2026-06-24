package com.sass.kb.common.permission;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * 解析资源父子继承链（用于权限继承检查）。
 * 实现类在各自的业务模块中提供。
 */
public interface ResourceParentResolver {

    /**
     * 返回当前资源的父级链（最近的在前）。
     * 例如 doc-1 → [(folder, folder-1), (space, space-1)]
     */
    List<ResourceRef> resolveParents(String resourceType, String resourceId);

    @Data
    @AllArgsConstructor
    class ResourceRef {
        private String type;
        private String id;
    }
}
