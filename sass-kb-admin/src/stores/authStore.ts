import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  realName: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  realName: string | null;
  login: (account: string, password: string) => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
  setUser: (userId: string, realName: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      realName: null,
      login: async (account, password) => {
        const json = await api.post<unknown, { code: number; message: string; data: LoginResponse }>('/auth/login', { account, password });
        if (json.code !== 200) throw new Error(json.message);
        const d = json.data;
        set({
          accessToken: d.accessToken,
          refreshToken: d.refreshToken,
          userId: d.userId,
          realName: d.realName,
        });
      },
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (userId, realName) => set({ userId, realName }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, userId: null, realName: null }),
    }),
    { name: 'sass-kb-auth' }
  )
);
