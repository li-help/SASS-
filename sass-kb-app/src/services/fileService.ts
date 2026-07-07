import api from './api';
import type { ApiResponse, PageResult } from './docService';

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
  upload: (file: { uri: string; name: string; type: string }, spaceId?: string) => {
    const fd = new FormData();
    fd.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
    if (spaceId) fd.append('spaceId', spaceId);
    return api.post<any, ApiResponse<FileAsset>>('/file/upload', fd);
  },

  getById: (id: string) =>
    api.get<ApiResponse<FileAsset>>(`/file/${id}`),

  getDownloadUrl: (id: string) =>
    api.get<ApiResponse<string>>(`/file/${id}/download`),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/file/${id}`),

  list: (params: { spaceId?: string; page?: number; size?: number; keyword?: string }) =>
    api.get<ApiResponse<PageResult<FileAsset>>>('/file/list', { params }),
};
