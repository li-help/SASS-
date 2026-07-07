package com.sass.kb.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sass.kb.auth.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}
