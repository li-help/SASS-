import axios from 'axios';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/authStore';
import { API_BASE_URL } from '@/config';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      const refresh = await SecureStore.getItemAsync('refreshToken');
      if (!refresh) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
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
        await SecureStore.setItemAsync('accessToken', d.accessToken);
        await SecureStore.setItemAsync('refreshToken', d.refreshToken);
        refreshQueue.forEach((cb) => cb(d.accessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${d.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
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

export default api;
