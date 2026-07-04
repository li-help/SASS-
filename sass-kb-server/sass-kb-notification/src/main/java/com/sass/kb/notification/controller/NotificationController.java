package com.sass.kb.notification.controller;

import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "通知", description = "通知消息管理")
@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "获取通知列表")
    @GetMapping("/list")
    public R<PageResult<?>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return R.ok(notificationService.list(userId, page, size));
    }

    @Operation(summary = "获取未读通知数量")
    @GetMapping("/unread-count")
    public R<Map<String, Object>> unreadCount(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return R.ok(Map.of("count", notificationService.unreadCount(userId)));
    }

    @Operation(summary = "标记通知为已读")
    @PutMapping("/{id}/read")
    public R<Void> markRead(@PathVariable String id, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        notificationService.markRead(id, userId);
        return R.ok();
    }

    @Operation(summary = "全部标记为已读")
    @PutMapping("/read-all")
    public R<Void> markAllRead(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        notificationService.markAllRead(userId);
        return R.ok();
    }
}
