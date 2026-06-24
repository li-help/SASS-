import api from './api';

// ---- 通用响应格式 ----
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  page: number;
  size: number;
}

// ---- 空间 ----
export interface Space {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceTreeNode {
  id: string;
  name: string;
  type: 'space' | 'folder' | 'doc';
  status?: string;
  updatedAt?: string;
  children?: SpaceTreeNode[];
}

// ---- 文档 ----
export interface Document {
  id: string;
  spaceId: string;
  folderId: string;
  tenantId: string;
  title: string;
  contentJson: string;
  contentHtml: string;
  status: string;
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocSaveRequest {
  title: string;
  contentJson: string;
  contentHtml: string;
  version: number;
  changeSummary?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  contentJson: string;
  contentHtml: string;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}

// ---- Folder ----
export interface Folder {
  id: string;
  spaceId: string;
  parentId: string;
  name: string;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ---- API 方法 ----
export const spaceApi = {
  list: (keyword?: string) =>
    api.get<any, ApiResponse<Space[]>>('/space/list', { params: { keyword } }),

  create: (data: Partial<Space>) =>
    api.post<any, ApiResponse<Space>>('/space', data),

  update: (id: string, data: Partial<Space>) =>
    api.put<any, ApiResponse<Space>>(`/space/${id}`, data),

  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/space/${id}`),

  getTree: (id: string) =>
    api.get<any, ApiResponse<SpaceTreeNode[]>>(`/space/${id}/tree`),
};

export const folderApi = {
  create: (data: Partial<Folder>) =>
    api.post<any, ApiResponse<Folder>>('/folder', data),

  update: (id: string, data: Partial<Folder>) =>
    api.put<any, ApiResponse<Folder>>(`/folder/${id}`, data),

  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/folder/${id}`),

  move: (id: string, targetParentId: string) =>
    api.put<any, ApiResponse<void>>(`/folder/${id}/move?targetParentId=${targetParentId}`),

  sort: (items: { id: string; sortOrder: number }[]) =>
    api.put<any, ApiResponse<void>>('/folder/sort', items),
};

export const docApi = {
  create: (data: Partial<Document>) =>
    api.post<any, ApiResponse<Document>>('/doc', data),

  getById: (id: string) =>
    api.get<any, ApiResponse<Document>>(`/doc/${id}`),

  save: (id: string, data: DocSaveRequest) =>
    api.put<any, ApiResponse<Document>>(`/doc/${id}`, data),

  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/doc/${id}`),

  updateStatus: (id: string, status: string) =>
    api.put<any, ApiResponse<Document>>(`/doc/${id}/status?status=${status}`),

  getVersions: (id: string) =>
    api.get<any, ApiResponse<DocumentVersion[]>>(`/doc/${id}/versions`),

  getVersion: (id: string, versionNumber: number) =>
    api.get<any, ApiResponse<DocumentVersion>>(`/doc/${id}/versions/${versionNumber}`),

  list: (params: {
    spaceId: string;
    folderId?: string;
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
  }) => api.get<any, ApiResponse<PageResult<Document>>>('/doc/list', { params }),
};
