package com.sass.kb.notification.controller;

import com.sass.kb.common.result.PageResult;
import com.sass.kb.common.result.R;
import com.sass.kb.notification.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/list")
    public R<PageResult<?>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return R.ok(notificationService.list(userId, page, size));
    }

    @GetMapping("/unread-count")
    public R<Map<String, Object>> unreadCount(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return R.ok(Map.of("count", notificationService.unreadCount(userId)));
    }

    @PutMapping("/{id}/read")
    public R<Void> markRead(@PathVariable String id, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        notificationService.markRead(id, userId);
        return R.ok();
    }

    @PutMapping("/read-all")
    public R<Void> markAllRead(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        notificationService.markAllRead(userId);
        return R.ok();
    }
}
