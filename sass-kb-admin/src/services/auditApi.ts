import api from './api';
import type { PageResult, ApiResponse } from '@/types/common';

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  username: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  ipAddress: string;
  createdAt: string;
}

export const auditApi = {
  list: (params?: { page?: number; size?: number; action?: string; userId?: string; startDate?: string; endDate?: string }) =>
    api.get<any, ApiResponse<PageResult<AuditLog>>>('/audit/list', { params }),
};
