package com.sass.kb.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectRequest {
    @NotBlank(message = "驳回原因不能为空")
    private String reason;
}
