package com.sass.kb.onboarding.controller;

import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.onboarding.dto.ApplyRequest;
import com.sass.kb.onboarding.dto.ApplicationVO;
import com.sass.kb.onboarding.dto.RejectRequest;
import com.sass.kb.onboarding.service.MerchantApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final MerchantApplicationService service;

    // ── 公开接口 ──

    @PostMapping("/apply")
    public R<String> apply(@Valid @RequestBody ApplyRequest req) {
        String applicationId = service.apply(req);
        return R.ok(applicationId);
    }

    @GetMapping("/status")
    public R<ApplicationVO> status(@RequestParam String applicationId) {
        return R.ok(service.getStatus(applicationId));
    }

    // ── 管理员接口 ──

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

    @GetMapping("/applications/{id}")
    public R<ApplicationVO> detail(@PathVariable String id, HttpServletRequest request) {
        checkSuperAdmin(request);
        return R.ok(service.getApplication(id));
    }

    @PostMapping("/applications/{id}/approve")
    public R<ApplicationVO> approve(@PathVariable String id, HttpServletRequest request) {
        checkSuperAdmin(request);
        String reviewerId = (String) request.getAttribute("userId");
        return R.ok(service.approve(id, reviewerId));
    }

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
