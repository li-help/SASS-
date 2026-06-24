package com.sass.kb.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sass.kb.auth.entity.Role;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RoleMapper extends BaseMapper<Role> {

    @Select("SELECT r.* FROM role r INNER JOIN permission_rule pr ON r.id = pr.target_id " +
            "WHERE pr.subject_type = 'user' AND pr.subject_id = #{userId} " +
            "AND pr.target_type = 'role' AND pr.effect = 'allow' AND pr.action = 'member'")
    List<Role> selectByUserId(@Param("userId") String userId);
}
