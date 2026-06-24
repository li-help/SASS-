package com.sass.kb.common.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sass.kb.common.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}
