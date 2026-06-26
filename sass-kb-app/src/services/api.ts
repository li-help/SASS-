import axios from 'axios';
import { Alert } from 'react-native';
import { storage } from '@/utils/storage';
import { API_BASE_URL } from '@/config';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await storage.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 请求去重：同一个 GET 请求在 2 秒内不重复发送
const inflightRequests = new Map<string, Promise<any>>();
const DEDUP_WINDOW = 2000;

api.interceptors.request.use((config) => {
  if (config.method === 'get') {
    const key = `${config.url}:${JSON.stringify(config.params || '')}`;
    const now = Date.now();
    const cached = inflightRequests.get(key);
    if (cached) {
      const cachedEntry = cached as any;
      if (now - cachedEntry._ts < DEDUP_WINDOW) {
        return Promise.reject({ __dedup: true, __key: key, __promise: cachedEntry });
      }
      inflightRequests.delete(key);
    }
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => {
    // Store GET response for dedup
    const config = res.config as any;
    if (config.method === 'get') {
      const key = `${config.url}:${JSON.stringify(config.params || '')}`;
      const entry = inflightRequests.get(key) as any;
      if (entry) {
        entry._ts = Date.now();
      }
    }
    return res.data;
  },
  async (error) => {
    // 去重请求被取消时，复用已有的 Promise
    if (error?.__dedup) {
      return error.__promise;
    }

    const original = error.config;
    if (!original) return Promise.reject(error);

    if (error.response?.status === 401 && !original._retry) {
      const refresh = await storage.get('refreshToken');
      if (!refresh) {
        await storage.delete('accessToken');
        await storage.delete('refreshToken');
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
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: refresh });
        const d = res.data.data;
        await storage.set('accessToken', d.accessToken);
        await storage.set('refreshToken', d.refreshToken);
        refreshQueue.forEach((cb) => cb(d.accessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${d.accessToken}`;
        return api(original);
      } catch {
        await storage.delete('accessToken');
        await storage.delete('refreshToken');
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    if (error.response?.status === 403) {
      Alert.alert('权限不足', '没有操作权限');
    }
    return Promise.reject(error);
  }
);

// 定期清理过期的去重缓存
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of inflightRequests.entries()) {
    if (now - (val as any)._ts > DEDUP_WINDOW * 2) {
      inflightRequests.delete(key);
    }
  }
}, 10_000);

export default api;
