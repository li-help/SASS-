import api from './api';
import type { PageResult, ApiResponse } from '@/types/common';
import type { User, Tenant } from '@/types/user';

export interface DashboardStats {
  spaces: number;
  docs: number;
  files: number;
  users: number;
  recentDocs: Array<{
    id: string;
    title: string;
    spaceId: string;
    status: string;
    updatedAt: string;
  }>;
}

export const dashboardApi = {
  stats: () => api.get<any, ApiResponse<DashboardStats>>('/dashboard/stats'),
};

export const tenantApi = {
  list: (params: { page: number; size: number; keyword?: string }) =>
    api.get<any, ApiResponse<PageResult<Tenant>>>('/tenant/list', { params }),
  create: (data: Partial<Tenant>) =>
    api.post<any, ApiResponse<Tenant>>('/tenant', data),
  update: (id: string, data: Partial<Tenant>) =>
    api.put<any, ApiResponse<void>>(`/tenant/${id}`, data),
  toggleStatus: (id: string, status: string) =>
    api.put<any, ApiResponse<void>>(`/tenant/${id}/status?status=${status}`),
};

export const userApi = {
  list: (params: { page: number; size: number; keyword?: string }) =>
    api.get<any, ApiResponse<PageResult<User>>>('/user/list', { params }),
  create: (data: Partial<User>) =>
    api.post<any, ApiResponse<{ user: User; initialPassword: string }>>('/user', data),
  update: (id: string, data: Partial<User>) =>
    api.put<any, ApiResponse<void>>(`/user/${id}`, data),
  toggleStatus: (id: string, status: string) =>
    api.put<any, ApiResponse<void>>(`/user/${id}/status?status=${status}`),
  resetPassword: (id: string) =>
    api.put<any, ApiResponse<{ newPassword: string }>>(`/user/${id}/password`),
  me: () => api.get<any, ApiResponse<User>>('/user/me'),
};
