package com.zhentao.common.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Date;

@Component
public class MyMetaObjectHandler implements MetaObjectHandler {
    
    @Override
    public void insertFill(MetaObject metaObject) {
        // 自动填充创建时间、更新时间 (支持 LocalDateTime 类型)
        this.strictInsertFill(metaObject, "createTime", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());

        // 自动填充创建时间、更新时间 (兼容 Date 类型)
        this.strictInsertFill(metaObject, "createTime", Date.class, new Date());
        this.strictInsertFill(metaObject, "updateTime", Date.class, new Date());
        
        // 自动填充逻辑删除字段，默认值为 0 (未删除)
        this.strictInsertFill(metaObject, "isDeleted", Integer.class, 0);
        this.strictInsertFill(metaObject, "deleted", Integer.class, 0);
        
        // 如果以后有全局获取用户信息的上下文，这里可以填充 createBy 和 updateBy
        // this.strictInsertFill(metaObject, "createBy", Long.class, BaseContext.getCurrentUserId());
        // this.strictInsertFill(metaObject, "updateBy", Long.class, BaseContext.getCurrentUserId());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        // 自动填充更新时间 (支持 LocalDateTime)
        this.strictUpdateFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
        
        // 自动填充更新时间 (兼容 Date)
        this.strictUpdateFill(metaObject, "updateTime", Date.class, new Date());
    }
}
