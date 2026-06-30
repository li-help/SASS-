package com.sass.kb.onboarding.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("merchant_application")
public class MerchantApplication {
    @TableId
    private String id;

    // 企业信息
    private String companyName;
    private String creditCode;
    private String licenseUrl;
    private String legalPerson;
    private String companyAddress;
    private String businessScope;
    private String contactPhone;
    private String contactEmail;

    // 申请人信息
    private String username;
    private String passwordHash;
    private String realName;
    private String email;
    private String phone;

    // 审核信息
    private String status;
    private String reviewComment;
    private String reviewedBy;
    private LocalDateTime reviewedAt;

    // 通过后关联
    private String tenantId;
    private String userId;

    // 时间戳
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
