import api from './api';
import type { ApiResponse, PageResult } from '@/types/common';

export interface Teacher {
  id: string;
  teacherName: string;
  avatar?: string;
  title?: string;
  intro?: string;
  sort: number;
  status: number;
  createdAt: string;
}

export interface CourseCategory {
  id: string;
  catName: string;
  parentId?: string;
  sort: number;
  status: number;
  createdAt: string;
  children?: CourseCategory[];
}

export interface CoursePeriod {
  id: string;
  chapterId: string;
  courseId: string;
  periodName: string;
  periodDesc?: string;
  periodType: number;
  duration: number;
  resourceUrl?: string;
  isFree: number;
  sort: number;
}

export interface CourseChapter {
  id: string;
  courseId: string;
  chapterName: string;
  chapterDesc?: string;
  periodCount: number;
  sort: number;
  periods?: CoursePeriod[];
}

export interface Course {
  id: string;
  courseName: string;
  categoryId?: string;
  categoryName?: string;
  teacherId?: string;
  teacherName?: string;
  cover?: string;
  introduce?: string;
  totalChapter: number;
  totalDuration: number;
  originalPrice: number;
  currentPrice: number;
  studentCount: number;
  difficulty: number;
  status: number;
  sort: number;
  createdAt: string;
}

export interface CourseDetail extends Course {
  teacherTitle?: string;
  chapters: CourseChapter[];
}

export const teacherApi = {
  list: (params?: { page?: number; size?: number; keyword?: string }) =>
    api.get<any, ApiResponse<PageResult<Teacher>>>('/course/teacher/list', { params }),
  all: () =>
    api.get<any, ApiResponse<PageResult<Teacher>>>('/course/teacher/all'),
  getById: (id: string) =>
    api.get<any, ApiResponse<Teacher>>(`/course/teacher/${id}`),
  create: (data: Partial<Teacher>) =>
    api.post<any, ApiResponse<Teacher>>('/course/teacher', data),
  update: (id: string, data: Partial<Teacher>) =>
    api.put<any, ApiResponse<Teacher>>(`/course/teacher/${id}`, data),
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/course/teacher/${id}`),
};

export const categoryApi = {
  tree: () =>
    api.get<any, ApiResponse<CourseCategory[]>>('/course/category/tree'),
  getById: (id: string) =>
    api.get<any, ApiResponse<CourseCategory>>(`/course/category/${id}`),
  create: (data: Partial<CourseCategory>) =>
    api.post<any, ApiResponse<CourseCategory>>('/course/category', data),
  update: (id: string, data: Partial<CourseCategory>) =>
    api.put<any, ApiResponse<CourseCategory>>(`/course/category/${id}`, data),
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/course/category/${id}`),
};

export const chapterApi = {
  listByCourse: (courseId: string) =>
    api.get<any, ApiResponse<CourseChapter[]>>('/course/chapter/list', { params: { courseId } }),
  create: (data: Partial<CourseChapter>) =>
    api.post<any, ApiResponse<CourseChapter>>('/course/chapter', data),
  update: (id: string, data: Partial<CourseChapter>) =>
    api.put<any, ApiResponse<CourseChapter>>(`/course/chapter/${id}`, data),
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/course/chapter/${id}`),
};

export const periodApi = {
  listByChapter: (chapterId: string) =>
    api.get<any, ApiResponse<CoursePeriod[]>>('/course/period/list', { params: { chapterId } }),
  create: (data: Partial<CoursePeriod>) =>
    api.post<any, ApiResponse<CoursePeriod>>('/course/period', data),
  update: (id: string, data: Partial<CoursePeriod>) =>
    api.put<any, ApiResponse<CoursePeriod>>(`/course/period/${id}`, data),
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/course/period/${id}`),
};

export const courseApi = {
  list: (params?: Record<string, any>) =>
    api.get<any, ApiResponse<PageResult<Course>>>('/course/course/list', { params }),
  getById: (id: string) =>
    api.get<any, ApiResponse<CourseDetail>>(`/course/course/${id}`),
  create: (data: Partial<Course>) =>
    api.post<any, ApiResponse<Course>>('/course/course', data),
  update: (id: string, data: Partial<Course>) =>
    api.put<any, ApiResponse<Course>>(`/course/course/${id}`, data),
  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/course/course/${id}`),
};
