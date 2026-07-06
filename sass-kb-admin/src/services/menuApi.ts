import api from './api';
import type { ApiResponse, PageResult } from '@/types/common';

export interface Menu {
  id: string;
  tenantId: string;
  parentId?: string;
  name: string;
  menuType: string;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  sortOrder: number;
  visible: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  children?: Menu[];
}

export const menuApi = {
  tree: () =>
    api.get<any, ApiResponse<Menu[]>>('/menu/tree'),
  list: (params?: { page?: number; size?: number; keyword?: string }) =>
    api.get<any, ApiResponse<PageResult<Menu>>>('/menu/list', { params }),
  create: (data: Partial<Menu>) =>
    api.post<any, ApiResponse<Menu>>('/menu', data),
  update: (id: string, data: Partial<Menu>) =>
    api.put<any, ApiResponse<void>>(`/menu/${id}`, data),
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/menu/${id}`),
  initDefaults: () =>
    api.post<any, ApiResponse<Menu[]>>('/menu/init-defaults'),
};
