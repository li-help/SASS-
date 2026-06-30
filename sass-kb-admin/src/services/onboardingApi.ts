import api from './api';
import type { ApiResponse, PageResult } from '@/types/common';
import type { ApplyRequest, ApplicationVO, RejectRequest } from '@/types/onboarding';

export const onboardingApi = {
  /** 提交入驻申请（公开） */
  apply: (data: ApplyRequest) =>
    api.post<any, ApiResponse<string>>('/onboarding/apply', data),

  /** 查询申请进度（公开） */
  status: (applicationId: string) =>
    api.get<any, ApiResponse<ApplicationVO>>('/onboarding/status', {
      params: { applicationId },
    }),

  /** 管理员：申请列表 */
  list: (params?: { page?: number; size?: number; status?: string; keyword?: string }) =>
    api.get<any, ApiResponse<PageResult<ApplicationVO>>>('/onboarding/applications', { params }),

  /** 管理员：申请详情 */
  detail: (id: string) =>
    api.get<any, ApiResponse<ApplicationVO>>(`/onboarding/applications/${id}`),

  /** 管理员：审核通过 */
  approve: (id: string) =>
    api.post<any, ApiResponse<ApplicationVO>>(`/onboarding/applications/${id}/approve`),

  /** 管理员：审核驳回 */
  reject: (id: string, data: RejectRequest) =>
    api.post<any, ApiResponse<ApplicationVO>>(`/onboarding/applications/${id}/reject`, data),
};
