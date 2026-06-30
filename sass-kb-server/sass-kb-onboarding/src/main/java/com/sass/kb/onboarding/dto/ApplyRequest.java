package com.sass.kb.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApplyRequest {

    // ── 企业信息 ──
    @NotBlank(message = "公司全称不能为空")
    @Size(max = 200)
    private String companyName;

    @NotBlank(message = "统一社会信用代码不能为空")
    @Size(min = 18, max = 18, message = "统一社会信用代码为 18 位")
    private String creditCode;

    private String licenseUrl;
    private String legalPerson;
    private String companyAddress;
    private String businessScope;
    private String contactPhone;
    private String contactEmail;

    // ── 管理员账号 ──
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100)
    private String password;

    @NotBlank(message = "真实姓名不能为空")
    @Size(max = 100)
    private String realName;

    private String email;
    private String phone;
}
