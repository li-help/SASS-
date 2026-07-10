package com.zhentao.auth.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.*;

/**
 * PostgreSQL jsonb 类型处理器。
 * 写入时使用 setObject(..., Types.OTHER) 确保 PostgreSQL 将 JSON 字符串识别为 jsonb 类型。
 * 读取时从 ResultSet 中获取原始对象，兼容 PGobject 和 String 两种返回格式。
 */
public class JsonbTypeHandler extends BaseTypeHandler<String[]> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, String[] parameter, JdbcType jdbcType) throws SQLException {
        try {
            String json = MAPPER.writeValueAsString(parameter);
            ps.setObject(i, json, Types.OTHER);
        } catch (JsonProcessingException e) {
            throw new SQLException("Failed to serialize String[] to JSON", e);
        }
    }

    @Override
    public String[] getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parse(rs.getObject(columnName));
    }

    @Override
    public String[] getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parse(rs.getObject(columnIndex));
    }

    @Override
    public String[] getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parse(cs.getObject(columnIndex));
    }

    private String[] parse(Object value) throws SQLException {
        if (value == null) {
            return null;
        }
        try {
            return MAPPER.readValue(value.toString(), String[].class);
        } catch (JsonProcessingException e) {
            throw new SQLException("Failed to parse JSON from database: " + value, e);
        }
    }
}
