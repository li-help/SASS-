package com.sass.kb.onboarding.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ApplicationVO {
    private String id;
    private String companyName;
    private String creditCode;
    private String licenseUrl;
    private String legalPerson;
    private String companyAddress;
    private String businessScope;
    private String contactPhone;
    private String contactEmail;
    private String username;
    private String realName;
    private String email;
    private String phone;
    private String status;
    private String reviewComment;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private String tenantId;
    private String userId;
    private LocalDateTime createdAt;
}
