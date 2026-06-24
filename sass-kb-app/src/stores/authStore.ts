import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config';

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  realName: string | null;
  login: (account: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  userId: null,
  realName: null,

  login: async (account, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password }),
    });
    const json = await res.json();
    if (json.code !== 200) throw new Error(json.message);
    const d = json.data;
    await SecureStore.setItemAsync('accessToken', d.accessToken);
    await SecureStore.setItemAsync('refreshToken', d.refreshToken);
    set({ isLoggedIn: true, userId: d.userId, realName: d.realName });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ isLoggedIn: false, userId: null, realName: null });
  },

  restoreSession: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.code === 200 && json.data) {
        set({
          isLoggedIn: true,
          userId: json.data.id,
          realName: json.data.realName,
        });
        return;
      }
    } catch {
      // 网络错误，保持登录状态但无法获取用户信息
      set({ isLoggedIn: true });
      return;
    }
    // token 无效，清除
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },
}));
