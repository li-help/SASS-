package com.sass.kb.onboarding.service;

import cn.hutool.core.util.IdUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sass.kb.auth.entity.Role;
import com.sass.kb.auth.entity.User;
import com.sass.kb.auth.mapper.RoleMapper;
import com.sass.kb.auth.mapper.UserMapper;
import com.sass.kb.common.exception.BizException;
import com.sass.kb.common.result.PageResult;
import com.sass.kb.notification.entity.Notification;
import com.sass.kb.notification.service.NotificationService;
import com.sass.kb.onboarding.dto.ApplyRequest;
import com.sass.kb.onboarding.dto.ApplicationVO;
import com.sass.kb.onboarding.dto.RejectRequest;
import com.sass.kb.onboarding.entity.MerchantApplication;
import com.sass.kb.onboarding.mapper.MerchantApplicationMapper;
import com.sass.kb.tenant.entity.Tenant;
import com.sass.kb.tenant.mapper.TenantMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantApplicationService {

    private final MerchantApplicationMapper applicationMapper;
    private final TenantMapper tenantMapper;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final NotificationService notificationService;

    // ── 公共 API ──

    public String apply(ApplyRequest req) {
        // 1. 校验信用代码唯一性
        boolean creditExists = applicationMapper.exists(
                new LambdaQueryWrapper<MerchantApplication>()
                        .eq(MerchantApplication::getCreditCode, req.getCreditCode())
                        .ne(MerchantApplication::getStatus, "rejected"));
        if (creditExists) {
            throw new BizException("该统一社会信用代码已提交过申请");
        }

        // 2. 校验用户名不重复（跨 user 表和 application 表）
        boolean usernameExistsInUser = userMapper.exists(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, req.getUsername()));
        if (usernameExistsInUser) {
            throw new BizException("该用户名已存在");
        }
        boolean usernameExistsInApp = applicationMapper.exists(
                new LambdaQueryWrapper<MerchantApplication>()
                        .eq(MerchantApplication::getUsername, req.getUsername())
                        .eq(MerchantApplication::getStatus, "pending"));
        if (usernameExistsInApp) {
            throw new BizException("该用户名已有待审核的申请");
        }

        // 3. 保存申请
        MerchantApplication app = new MerchantApplication();
        app.setId(IdUtil.fastSimpleUUID());
        app.setCompanyName(req.getCompanyName());
        app.setCreditCode(req.getCreditCode());
        app.setLicenseUrl(req.getLicenseUrl());
        app.setLegalPerson(req.getLegalPerson());
        app.setCompanyAddress(req.getCompanyAddress());
        app.setBusinessScope(req.getBusinessScope());
        app.setContactPhone(req.getContactPhone());
        app.setContactEmail(req.getContactEmail());
        app.setUsername(req.getUsername());
        app.setPasswordHash(BCrypt.hashpw(req.getPassword()));
        app.setRealName(req.getRealName());
        app.setEmail(req.getEmail());
        app.setPhone(req.getPhone());
        app.setStatus("pending");
        app.setCreatedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());

        applicationMapper.insert(app);
        log.info("商家入驻申请已提交: id={}, company={}, username={}", app.getId(), app.getCompanyName(), app.getUsername());
        return app.getId();
    }

    // ── 管理员 API ──

    public PageResult<ApplicationVO> listApplications(int page, int size, String status, String keyword) {
        LambdaQueryWrapper<MerchantApplication> wrapper = new LambdaQueryWrapper<MerchantApplication>()
                .eq(status != null && !status.isBlank(), MerchantApplication::getStatus, status)
                .and(keyword != null && !keyword.isBlank(), w -> w
                        .like(MerchantApplication::getCompanyName, keyword)
                        .or()
                        .like(MerchantApplication::getUsername, keyword))
                .orderByDesc(MerchantApplication::getCreatedAt);

        Page<MerchantApplication> p = applicationMapper.selectPage(
                new Page<>(page, size), wrapper);

        List<ApplicationVO> vos = p.getRecords().stream().map(this::toVO).toList();
        return new PageResult<>(vos, p.getTotal(), page, size);
    }

    public ApplicationVO getApplication(String id) {
        MerchantApplication app = applicationMapper.selectById(id);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        return toVO(app);
    }

    @Transactional
    public ApplicationVO approve(String id, String reviewerId) {
        MerchantApplication app = applicationMapper.selectById(id);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        if (!"pending".equals(app.getStatus())) {
            throw new BizException("该申请不是待审核状态");
        }

        // 1. 创建租户
        Tenant tenant = new Tenant();
        tenant.setId(IdUtil.fastSimpleUUID());
        tenant.setName(app.getCompanyName());
        tenant.setContactName(app.getRealName());
        tenant.setContactPhone(app.getContactPhone());
        tenant.setStatus("active");
        tenantMapper.insert(tenant);

        // 2. 创建超级管理员用户
        User user = new User();
        user.setId(IdUtil.fastSimpleUUID());
        user.setTenantId(tenant.getId());
        user.setUsername(app.getUsername());
        user.setPasswordHash(app.getPasswordHash());
        user.setRealName(app.getRealName());
        user.setEmail(app.getEmail());
        user.setPhone(app.getPhone());
        user.setStatus("active");
        user.setIsSuperAdmin(true);
        userMapper.insert(user);

        // 3. 初始化默认角色
        String adminRoleId = IdUtil.fastSimpleUUID();
        Role adminRole = new Role();
        adminRole.setId(adminRoleId);
        adminRole.setTenantId(tenant.getId());
        adminRole.setName("管理员");
        adminRole.setDescription("拥有所有权限");
        adminRole.setPermissions(new String[]{"*:*"});
        roleMapper.insert(adminRole);

        String editorId = IdUtil.fastSimpleUUID();
        Role editor = new Role();
        editor.setId(editorId);
        editor.setTenantId(tenant.getId());
        editor.setName("编辑者");
        editor.setDescription("可查看内容并编辑文档");
        editor.setPermissions(new String[]{"space:read", "doc:read", "doc:write", "file:read", "file:write"});
        roleMapper.insert(editor);

        Role viewer = new Role();
        viewer.setId(IdUtil.fastSimpleUUID());
        viewer.setTenantId(tenant.getId());
        viewer.setName("阅读者");
        viewer.setDescription("仅可查看内容");
        viewer.setParentId(editorId);
        viewer.setPermissions(new String[]{"space:read", "doc:read", "file:read"});
        roleMapper.insert(viewer);

        // 4. 更新申请状态
        app.setStatus("approved");
        app.setTenantId(tenant.getId());
        app.setUserId(user.getId());
        app.setReviewedBy(reviewerId);
        app.setReviewedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());
        applicationMapper.updateById(app);

        // 5. 发送通知
        try {
            Notification notif = new Notification();
            notif.setId(IdUtil.fastSimpleUUID());
            notif.setUserId(user.getId());
            notif.setTitle("商家入驻审核通过");
            notif.setContent("恭喜！您的企业「" + app.getCompanyName() + "」入驻申请已通过审核，现在可以登录使用了。");
            notif.setType("onboarding");
            notif.setIsRead(false);
            notif.setCreatedAt(LocalDateTime.now());
            notificationService.create(notif);
        } catch (Exception e) {
            log.warn("发送入驻通过通知失败: {}", e.getMessage());
        }

        log.info("商家入驻审核通过: applicationId={}, tenantId={}, userId={}", id, tenant.getId(), user.getId());
        return toVO(app);
    }

    @Transactional
    public ApplicationVO reject(String id, String reviewerId, RejectRequest req) {
        MerchantApplication app = applicationMapper.selectById(id);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        if (!"pending".equals(app.getStatus())) {
            throw new BizException("该申请不是待审核状态");
        }

        app.setStatus("rejected");
        app.setReviewComment(req.getReason());
        app.setReviewedBy(reviewerId);
        app.setReviewedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());
        applicationMapper.updateById(app);

        log.info("商家入驻审核驳回: applicationId={}, reason={}", id, req.getReason());
        return toVO(app);
    }

    // ── 公开 API ──

    public ApplicationVO getStatus(String applicationId) {
        MerchantApplication app = applicationMapper.selectById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        ApplicationVO vo = new ApplicationVO();
        vo.setId(app.getId());
        vo.setCompanyName(app.getCompanyName());
        vo.setStatus(app.getStatus());
        vo.setReviewComment(app.getReviewComment());
        vo.setCreatedAt(app.getCreatedAt());
        return vo;
    }

    // ── 辅助方法 ──

    private ApplicationVO toVO(MerchantApplication app) {
        ApplicationVO vo = new ApplicationVO();
        vo.setId(app.getId());
        vo.setCompanyName(app.getCompanyName());
        vo.setCreditCode(app.getCreditCode());
        vo.setLicenseUrl(app.getLicenseUrl());
        vo.setLegalPerson(app.getLegalPerson());
        vo.setCompanyAddress(app.getCompanyAddress());
        vo.setBusinessScope(app.getBusinessScope());
        vo.setContactPhone(app.getContactPhone());
        vo.setContactEmail(app.getContactEmail());
        vo.setUsername(app.getUsername());
        vo.setRealName(app.getRealName());
        vo.setEmail(app.getEmail());
        vo.setPhone(app.getPhone());
        vo.setStatus(app.getStatus());
        vo.setReviewComment(app.getReviewComment());
        vo.setReviewedBy(app.getReviewedBy());
        vo.setReviewedAt(app.getReviewedAt());
        vo.setTenantId(app.getTenantId());
        vo.setUserId(app.getUserId());
        vo.setCreatedAt(app.getCreatedAt());
        return vo;
    }
}
