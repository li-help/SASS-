import api from './api';
import type { PageResult, ApiResponse } from '@/types/common';

export interface FileAsset {
  id: string;
  tenantId: string;
  spaceId: string;
  originalName: string;
  storePath: string;
  fileSize: number;
  mimeType: string;
  createdBy: string;
  createdAt: string;
}

export const fileApi = {
  upload: (file: File, spaceId?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (spaceId) fd.append('spaceId', spaceId);
    return api.post<any, ApiResponse<FileAsset>>('/file/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getById: (id: string) =>
    api.get<any, ApiResponse<FileAsset>>(`/file/${id}`),
  getDownloadUrl: (id: string) =>
    api.get<any, ApiResponse<string>>(`/file/${id}/download`),
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/file/${id}`),
  list: (params: { spaceId?: string; page?: number; size?: number; keyword?: string }) =>
    api.get<any, ApiResponse<PageResult<FileAsset>>>('/file/list', { params }),
};
