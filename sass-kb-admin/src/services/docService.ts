import api from './api';
import type { PageResult, ApiResponse } from '@/types/common';

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
  updatedBy?: string;
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
  diff: (id: string, v1: number, v2: number) =>
    api.get<any, ApiResponse<{ v1: string; v2: string; v1Version: string; v2Version: string }>>(`/doc/${id}/diff`, { params: { v1, v2 } }),
  list: (params: { spaceId: string; folderId?: string; page?: number; size?: number; keyword?: string; status?: string }) =>
    api.get<any, ApiResponse<PageResult<Document>>>('/doc/list', { params }),
  restoreVersion: (id: string, versionNumber: number) =>
    api.put<any, ApiResponse<Document>>(`/doc/${id}/versions/${versionNumber}/restore`),
  recent: (limit?: number) =>
    api.get<any, ApiResponse<Document[]>>('/doc/recent', { params: { limit } }),
};
