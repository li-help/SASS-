package com.sass.kb.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sass.kb.auth.entity.PermissionRule;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PermissionRuleMapper extends BaseMapper<PermissionRule> {

    @Select("SELECT DISTINCT pr.* FROM permission_rule pr " +
            "WHERE pr.tenant_id = #{tenantId} " +
            "AND pr.subject_type = 'user' AND pr.subject_id = #{userId} " +
            "AND (pr.target_type = #{resourceType} OR pr.target_type IS NULL) " +
            "AND (pr.target_id = #{resourceId} OR pr.target_id IS NULL) " +
            "UNION " +
            "SELECT DISTINCT pr.* FROM permission_rule pr " +
            "WHERE pr.tenant_id = #{tenantId} " +
            "AND pr.subject_type = 'role' " +
            "AND pr.subject_id IN (" +
            "  SELECT r.id FROM role r INNER JOIN permission_rule pr2 ON r.id = pr2.target_id " +
            "  WHERE pr2.subject_type = 'user' AND pr2.subject_id = #{userId} " +
            "  AND pr2.target_type = 'role' AND pr2.action = 'member' AND pr2.effect = 'allow'" +
            ") " +
            "AND (pr.target_type = #{resourceType} OR pr.target_type IS NULL) " +
            "AND (pr.target_id = #{resourceId} OR pr.target_id IS NULL)")
    List<PermissionRule> findApplicableRules(@Param("tenantId") String tenantId,
                                             @Param("userId") String userId,
                                             @Param("resourceType") String resourceType,
                                             @Param("resourceId") String resourceId);
}
