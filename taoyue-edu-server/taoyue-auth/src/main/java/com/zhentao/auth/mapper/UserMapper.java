package com.zhentao.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhentao.auth.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    @Select("SELECT u.* FROM \"user\" u INNER JOIN permission_rule pr ON u.id = pr.subject_id " +
            "WHERE pr.subject_type = 'user' AND pr.target_type = 'role' " +
            "AND pr.target_id = #{roleId} AND pr.action = 'member' AND pr.effect = 'allow'")
    List<User> selectByRoleId(@Param("roleId") String roleId);
}
