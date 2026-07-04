import axios, { type InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/stores/authStore';

// 扩展 axios 配置：支持 _retry 标记
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截：自动挂 token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// GET 请求去重：相同请求 2 秒内不重复发送
const inflight = new Map<string, { promise: Promise<any>; ts: number }>();
const DEDUP_MS = 2000;

api.interceptors.request.use((config) => {
  if (config.method === 'get') {
    const key = `${config.url}:${JSON.stringify(config.params || '')}`;
    const cached = inflight.get(key);
    if (cached && Date.now() - cached.ts < DEDUP_MS) {
      return Promise.reject({ __dedup: true, __promise: cached.promise });
    }
    inflight.delete(key);
  }
  return config;
});

// 定期清理过期缓存
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of inflight) {
    if (now - v.ts > DEDUP_MS * 2) inflight.delete(k);
  }
}, 10_000);

// 响应拦截：401 自动刷新或跳登录
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => {
    // 记录 GET 响应用于去重
    const config = res.config;
    if (config.method === 'get') {
      const key = `${config.url}:${JSON.stringify(config.params || '')}`;
      const entry = inflight.get(key);
      if (entry) entry.ts = Date.now();
    }
    return res.data;
  },
  async (error) => {
    // 去重请求：复用已有 Promise
    if (error?.__dedup) {
      return error.__promise;
    }

    const original = error.config as RetryableConfig | undefined;
    if (!original) return Promise.reject(error);

    if (error.response?.status === 401 && !original._retry) {
      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      if (!refreshToken) {
        message.error('登录已过期，请重新登录');
        logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const res = await api.post<unknown, { data: { accessToken: string; refreshToken: string } }>('/auth/refresh', { refreshToken });
        const data = res.data;
        setTokens(data.accessToken, data.refreshToken);
        refreshQueue.forEach((cb) => cb(data.accessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        message.error('登录已过期，请重新登录');
        logout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
