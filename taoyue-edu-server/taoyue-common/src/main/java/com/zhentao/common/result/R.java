package com.zhentao.common.result;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

@Data
@Schema(description = "全局统一返回结果")
public class R<T> implements Serializable {

    @Schema(description = "返回码(200成功,500失败)")
    private Integer code;
    
    @Schema(description = "返回信息")
    private String message;
    
    @Schema(description = "返回数据")
    private T data;

    public static <T> R<T> success() {
        return success(null);
    }

    public static <T> R<T> success(T data) {
        R<T> r = new R<>();
        r.setCode(200);
        r.setMessage("操作成功");
        r.setData(data);
        return r;
    }

    // -- 兼容 sass-kb-auth 的 ok/fail 方法 --

    public static <T> R<T> ok(T data) {
        return success(data);
    }

    public static <T> R<T> ok() {
        return success();
    }

    public static <T> R<T> fail(String message) {
        R<T> r = new R<>();
        r.setCode(500);
        r.setMessage(message);
        return r;
    }

    public static <T> R<T> fail(int code, String message) {
        R<T> r = new R<>();
        r.setCode(code);
        r.setMessage(message);
        return r;
    }

    public static <T> R<T> fail(Integer code, String message) {
        return fail(code.intValue(), message);
    }

    public boolean isSuccess() {
        return code != null && code == 200;
    }
}
