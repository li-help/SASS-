import { create } from 'zustand';
import { storage } from '@/utils/storage';
import api from '@/services/api';

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
    const res: any = await api.post('/auth/login', { account, password });
    if (res.code !== 200) throw new Error(res.message);
    const d = res.data;
    await storage.set('accessToken', d.accessToken);
    await storage.set('refreshToken', d.refreshToken);
    set({ isLoggedIn: true, userId: d.userId, realName: d.realName });
  },

  logout: async () => {
    await storage.delete('accessToken');
    await storage.delete('refreshToken');
    set({ isLoggedIn: false, userId: null, realName: null });
  },

  restoreSession: async () => {
    const token = await storage.get('accessToken');
    if (!token) return;
    try {
      const res: any = await api.get('/user/me');
      if (res.code === 200 && res.data) {
        set({
          isLoggedIn: true,
          userId: res.data.id,
          realName: res.data.realName,
        });
        return;
      }
      // code !== 200 说明 token 无效
      await storage.delete('accessToken');
      await storage.delete('refreshToken');
    } catch (e: any) {
      // 网络错误：保留 token 并标记已登录（离线可用）
      if (e?.response?.status === 401) {
        // Token 已过期且刷新失败，清除
        await storage.delete('accessToken');
        await storage.delete('refreshToken');
        return;
      }
      // 网络不可达等：保留登录状态
      set({ isLoggedIn: true });
    }
  },
}));
