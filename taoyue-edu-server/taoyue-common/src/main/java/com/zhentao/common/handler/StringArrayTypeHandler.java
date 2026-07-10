package com.zhentao.common.handler;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedTypes;
import org.springframework.stereotype.Component;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@MappedTypes(String[].class)
@Component
public class StringArrayTypeHandler extends BaseTypeHandler<String[]> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, String[] parameter, JdbcType jdbcType) throws SQLException {
        if (parameter == null || parameter.length == 0) {
            ps.setArray(i, ps.getConnection().createArrayOf("text", new String[0]));
        } else {
            ps.setArray(i, ps.getConnection().createArrayOf("text", parameter));
        }
    }

    @Override
    public String[] getNullableResult(ResultSet rs, String columnName) throws SQLException {
        java.sql.Array sqlArray = rs.getArray(columnName);
        if (sqlArray == null) {
            return new String[0];
        }
        return (String[]) sqlArray.getArray();
    }

    @Override
    public String[] getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        java.sql.Array sqlArray = rs.getArray(columnIndex);
        if (sqlArray == null) {
            return new String[0];
        }
        return (String[]) sqlArray.getArray();
    }

    @Override
    public String[] getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        java.sql.Array sqlArray = cs.getArray(columnIndex);
        if (sqlArray == null) {
            return new String[0];
        }
        return (String[]) sqlArray.getArray();
    }
}
