package com.sass.kb.onboarding.controller;

import com.sass.kb.common.event.EntityEvent;
import com.sass.kb.common.event.EventPublisher;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.onboarding.dto.ApplyRequest;
import com.sass.kb.onboarding.dto.ApplicationVO;
import com.sass.kb.onboarding.dto.RejectRequest;
import com.sass.kb.onboarding.service.MerchantApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "商家入驻", description = "商家入驻申请与审批")
@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final MerchantApplicationService service;
    private final EventPublisher eventPublisher;

    // ── 公开接口 ──

    @Operation(summary = "提交入驻申请")
    @PostMapping("/apply")
    public R<String> apply(@Valid @RequestBody ApplyRequest req) {
        String applicationId = service.apply(req);
        return R.ok(applicationId);
    }

    @Operation(summary = "查询申请状态")
    @GetMapping("/status")
    public R<ApplicationVO> status(@RequestParam String applicationId) {
        return R.ok(service.getStatus(applicationId));
    }

    // ── 管理员接口 ──

    @Operation(summary = "获取入驻申请列表")
    @GetMapping("/applications")
    public R<PageResult<ApplicationVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            HttpServletRequest request) {
        checkSuperAdmin(request);
        return R.ok(service.listApplications(page, size, status, keyword));
    }

    @Operation(summary = "获取入驻申请详情")
    @GetMapping("/applications/{id}")
    public R<ApplicationVO> detail(@PathVariable String id, HttpServletRequest request) {
        checkSuperAdmin(request);
        return R.ok(service.getApplication(id));
    }

    @Operation(summary = "审批通过入驻申请")
    @PostMapping("/applications/{id}/approve")
    public R<ApplicationVO> approve(@PathVariable String id, HttpServletRequest request) {
        checkSuperAdmin(request);
        String reviewerId = (String) request.getAttribute("userId");
        ApplicationVO vo = service.approve(id, reviewerId);
        // 入驻审核通过后新建了租户和用户
        eventPublisher.publish(EntityEvent.of("CREATED", "TENANT", vo.getTenantId(), null));
        eventPublisher.publish(EntityEvent.of("CREATED", "USER", vo.getUserId(), vo.getTenantId()));
        return R.ok(vo);
    }

    @Operation(summary = "驳回入驻申请")
    @PostMapping("/applications/{id}/reject")
    public R<ApplicationVO> reject(@PathVariable String id,
                                    @Valid @RequestBody RejectRequest rejectReq,
                                    HttpServletRequest request) {
        checkSuperAdmin(request);
        String reviewerId = (String) request.getAttribute("userId");
        return R.ok(service.reject(id, reviewerId, rejectReq));
    }

    private void checkSuperAdmin(HttpServletRequest request) {
        Boolean isSuperAdmin = (Boolean) request.getAttribute("isSuperAdmin");
        if (!Boolean.TRUE.equals(isSuperAdmin)) {
            throw new BizException(403, "仅平台超级管理员可操作");
        }
    }
}
