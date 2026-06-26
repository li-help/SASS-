package com.sass.kb.file.mapper;

import com.baomidou.mybatisplus.annotation.InterceptorIgnore;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sass.kb.file.entity.FileAsset;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.io.Serializable;

@Mapper
public interface FileAssetMapper extends BaseMapper<FileAsset> {

    @InterceptorIgnore(tenantLine = "true")
    @Select("SELECT * FROM file_asset WHERE id = #{id}")
    FileAsset selectByIdWithoutTenant(@Param("id") Serializable id);
}
