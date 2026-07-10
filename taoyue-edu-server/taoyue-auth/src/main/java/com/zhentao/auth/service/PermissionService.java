package com.zhentao.auth.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.zhentao.auth.entity.PermissionRule;
import com.zhentao.auth.entity.Role;
import com.zhentao.auth.mapper.PermissionRuleMapper;
import com.zhentao.auth.mapper.RoleMapper;
import com.zhentao.common.permission.ResourceParentResolver;
import com.zhentao.common.permission.ResourceParentResolver.ResourceRef;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRuleMapper permissionRuleMapper;
    private final RoleMapper roleMapper;
    private final RedisTemplate<String, String> redisTemplate;
    private final ResourceParentResolver resourceParentResolver;

    private Cache<String, Boolean> permissionCache;
    private Cache<String, Role> roleCache;

    @PostConstruct
    public void init() {
        permissionCache = Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(10_000)
                .build();
        roleCache = Caffeine.newBuilder()
                .expireAfterWrite(15, TimeUnit.MINUTES)
                .maximumSize(1_000)
                .build();
    }

    public boolean hasPermission(String userId, String tenantId, String resourceType,
                                  String resourceId, String action) {
        String cacheKey = buildCacheKey(tenantId, userId, resourceType, resourceId, action);
        return permissionCache.get(cacheKey, k ->
                evaluatePermission(tenantId, userId, resourceType, resourceId, action));
    }

    private boolean evaluatePermission(String tenantId, String userId, String resourceType,
                                        String resourceId, String action) {
        List<ResourceRef> chain = new ArrayList<>();
        chain.add(new ResourceRef(resourceType, resourceId));
        chain.addAll(resourceParentResolver.resolveParents(resourceType, resourceId));

        List<PermissionRule> allRules = new ArrayList<>();
        Set<String> seenRuleIds = new HashSet<>();
        for (ResourceRef ref : chain) {
            List<PermissionRule> rules = permissionRuleMapper.findApplicableRules(
                    tenantId, userId, ref.getType(), ref.getId());
            for (PermissionRule r : rules) {
                if (seenRuleIds.add(r.getId())) {
                    allRules.add(r);
                }
            }
        }

        for (PermissionRule r : allRules) {
            if ("deny".equals(r.getEffect()) && matchesAction(r.getAction(), action)) {
                return false;
            }
        }

        for (PermissionRule r : allRules) {
            if ("allow".equals(r.getEffect()) && "user".equals(r.getSubjectType())
                    && matchesAction(r.getAction(), action)) {
                return true;
            }
        }

        Set<String> roleIds = new HashSet<>();
        for (PermissionRule r : allRules) {
            if ("role".equals(r.getSubjectType()) && "allow".equals(r.getEffect())) {
                roleIds.add(r.getSubjectId());
            }
            if ("role".equals(r.getTargetType()) && "member".equals(r.getAction())
                    && "allow".equals(r.getEffect())) {
                roleIds.add(r.getTargetId());
            }
        }

        for (String roleId : roleIds) {
            if (roleHasPermission(roleId, resourceType, action, new HashSet<>())) {
                return true;
            }
        }

        return false;
    }

    private boolean roleHasPermission(String roleId, String resourceType,
                                       String action, Set<String> visited) {
        if (!visited.add(roleId)) return false;

        Role role = roleCache.get(roleId, roleMapper::selectById);
        if (role == null) return false;

        if (role.getPermissions() != null) {
            for (String perm : role.getPermissions()) {
                if (matchesPattern(perm, resourceType, action)) {
                    return true;
                }
            }
        }

        if (role.getParentId() != null && !role.getParentId().isBlank()) {
            return roleHasPermission(role.getParentId(), resourceType, action, visited);
        }

        return false;
    }

    public void invalidateCache() {
        permissionCache.invalidateAll();
        roleCache.invalidateAll();
    }

    public void broadcastInvalidation(String tenantId, String resourceType, String resourceId) {
        redisTemplate.convertAndSend("perm:invalidate",
                String.format("%s:%s:%s", tenantId, resourceType, resourceId));
    }

    private String buildCacheKey(String tenantId, String userId, String resourceType,
                                  String resourceId, String action) {
        return String.format("perm:%s:%s:%s:%s:%s", tenantId, userId, resourceType, resourceId, action);
    }

    private boolean matchesAction(String ruleAction, String requestedAction) {
        return ruleAction.equals(requestedAction) || "admin".equals(ruleAction);
    }

    private boolean matchesPattern(String perm, String resourceType, String action) {
        String[] parts = perm.split(":");
        if (parts.length != 2) return false;
        String pResource = parts[0];
        String pAction = parts[1];
        boolean resourceMatch = "*".equals(pResource) || pResource.equals(resourceType);
        boolean actionMatch = "*".equals(pAction) || pAction.equals(action) || "admin".equals(pAction);
        return resourceMatch && actionMatch;
    }
}
