import api from './api';
import type { ApiResponse } from '@/types/common';

export interface SearchResult {
  id: string;
  title: string;
  spaceId: string;
  updatedAt: string;
  score: number;
}

export interface SearchResponse {
  records: SearchResult[];
  total: number;
  page: number;
  size: number;
}

export const searchApi = {
  search: (params: { q: string; spaceId?: string; page?: number; size?: number }) =>
    api.get<any, ApiResponse<SearchResponse>>('/search', { params }),
};
