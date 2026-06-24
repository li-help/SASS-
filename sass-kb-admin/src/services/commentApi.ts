import api from './api';
import type { ApiResponse } from '@/types/common';

export interface CommentNode {
  id: string;
  documentId: string;
  parentId: string | null;
  content: string;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  children: CommentNode[];
}

export const commentApi = {
  list: (docId: string) =>
    api.get<any, ApiResponse<CommentNode[]>>(`/comment/list/${docId}`),
  create: (data: { documentId: string; content: string; parentId?: string }) =>
    api.post<any, ApiResponse<CommentNode>>('/comment', data),
  update: (id: string, content: string) =>
    api.put<any, ApiResponse<CommentNode>>(`/comment/${id}`, { content }),
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/comment/${id}`),
};
