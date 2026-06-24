import api from './api';
import type { PageResult, ApiResponse } from '@/types/common';
import type { User } from '@/types/user';

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  permissions: string[];
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionRule {
  id: string;
  tenantId: string;
  subjectType: 'user' | 'role';
  subjectId: string;
  targetType: 'space' | 'folder' | 'doc' | 'file';
  targetId: string | null;
  action: 'read' | 'write' | 'admin' | 'delete';
  effect: 'allow' | 'deny';
}

export const roleApi = {
  list: (params?: { page?: number; size?: number; keyword?: string }) =>
    api.get<any, ApiResponse<PageResult<Role>>>('/role/list', { params }),
  create: (data: Partial<Role>) =>
    api.post<any, ApiResponse<Role>>('/role', data),
  update: (id: string, data: Partial<Role>) =>
    api.put<any, ApiResponse<void>>(`/role/${id}`, data),
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/role/${id}`),
  assignUsers: (id: string, userIds: string[]) =>
    api.post<any, ApiResponse<void>>(`/role/${id}/assign`, userIds),
  getMembers: (id: string) =>
    api.get<any, ApiResponse<User[]>>(`/role/${id}/members`),
  removeMember: (roleId: string, userId: string) =>
    api.delete<any, ApiResponse<void>>(`/role/${roleId}/members/${userId}`),
  initDefaults: () =>
    api.post<any, ApiResponse<Role[]>>('/role/init-defaults'),
};

export const permissionApi = {
  listRules: (params?: { targetType?: string; targetId?: string; subjectType?: string }) =>
    api.get<any, ApiResponse<PermissionRule[]>>('/permission/rules', { params }),
  createRule: (data: Partial<PermissionRule>) =>
    api.post<any, ApiResponse<PermissionRule>>('/permission/rules', data),
  updateRule: (id: string, data: Partial<PermissionRule>) =>
    api.put<any, ApiResponse<void>>(`/permission/rules/${id}`, data),
  deleteRule: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/permission/rules/${id}`),
  batchCreateRules: (rules: Partial<PermissionRule>[]) =>
    api.post<any, ApiResponse<PermissionRule[]>>('/permission/rules/batch', rules),
  batchDeleteRules: (ids: string[]) =>
    api.delete<any, ApiResponse<void>>('/permission/rules/batch', { data: ids }),
  check: (params: { resourceType: string; resourceId: string; action: string }) =>
    api.get<any, ApiResponse<{ allowed: boolean }>>('/permission/check', { params }),
};
