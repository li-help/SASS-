package com.zhentao.common.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhentao.common.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}
