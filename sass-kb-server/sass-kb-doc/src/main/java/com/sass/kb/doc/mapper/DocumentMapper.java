package com.sass.kb.doc.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sass.kb.doc.entity.Document;
import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.annotation.InterceptorIgnore;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.io.Serializable;

@Mapper
public interface DocumentMapper extends BaseMapper<Document> {

    @InterceptorIgnore(tenantLine = "true")
    @Select("SELECT * FROM document WHERE id = #{id}")
    Document selectByIdWithoutTenant(@Param("id") Serializable id);
}
