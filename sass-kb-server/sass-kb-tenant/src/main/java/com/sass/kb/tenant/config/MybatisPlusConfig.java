package com.sass.kb.tenant.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.TenantLineInnerInterceptor;
import com.sass.kb.tenant.context.TenantContext;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.expression.StringValue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration
public class MybatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

        // 租户隔离拦截器
        TenantLineInnerInterceptor tenantInterceptor = new TenantLineInnerInterceptor();
        tenantInterceptor.setTenantLineHandler(new MyTenantLineHandler());
        interceptor.addInnerInterceptor(tenantInterceptor);

        // 分页拦截器
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.POSTGRE_SQL));

        return interceptor;
    }

    private static class MyTenantLineHandler implements com.baomidou.mybatisplus.extension.plugins.handler.TenantLineHandler {

        @Override
        public Expression getTenantId() {
            String tenantId = TenantContext.getCurrentTenantId();
            return new StringValue(tenantId != null ? tenantId : "");
        }

        @Override
        public String getTenantIdColumn() {
            return "tenant_id";
        }

        @Override
        public boolean ignoreTable(String tableName) {
            // 租户表、用户表不需要租户隔离
            if (tableName == null) return false;
            // 归一化：去除 JSQLParser 可能保留的 SQL 标识符引号（PostgreSQL "、MySQL `）
            String normalized = tableName.replace("\"", "").replace("`", "");
            return Set.of("tenant", "user").contains(normalized);
        }
    }
}
