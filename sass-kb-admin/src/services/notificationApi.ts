import api from './api';
import type { PageResult, ApiResponse } from '@/types/common';

export interface Notification {
  id: string;
  userId: string;
  type: 'comment' | 'mention' | 'permission';
  title: string;
  content: string;
  targetType: string;
  targetId: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  list: (params?: { page?: number; size?: number }) =>
    api.get<any, ApiResponse<PageResult<Notification>>>('/notification/list', { params }),
  unreadCount: () =>
    api.get<any, ApiResponse<{ count: number }>>('/notification/unread-count'),
  markRead: (id: string) =>
    api.put<any, ApiResponse<void>>(`/notification/${id}/read`),
  markAllRead: () =>
    api.put<any, ApiResponse<void>>('/notification/read-all'),
};
