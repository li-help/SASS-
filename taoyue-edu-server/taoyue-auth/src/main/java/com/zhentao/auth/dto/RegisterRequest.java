package com.zhentao.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度 3-50")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度 6-100")
    private String password;

    private String realName;

    private String email;

    private String phone;

    /** 可选：公司/租户名称，不为空时自动创建租户并将用户设为该租户管理员 */
    private String companyName;
}
