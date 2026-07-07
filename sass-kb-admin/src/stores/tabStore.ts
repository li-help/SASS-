import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TabItem {
  key: string;
  label: string;
  closable: boolean;
}

interface TabStore {
  tabs: TabItem[];
  activeKey: string;
  addTab: (key: string, label: string, closable?: boolean) => void;
  removeTab: (key: string) => void;
  setActiveKey: (key: string) => void;
}

const HOME_KEY = '/dashboard';
const HOME_LABEL = '仪表盘';

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [{ key: HOME_KEY, label: HOME_LABEL, closable: false }],
      activeKey: HOME_KEY,

      addTab: (key: string, label: string, closable = true) => {
        const { tabs } = get();
        const exists = tabs.find((t) => t.key === key);
        if (exists) {
          set({ activeKey: key });
          return;
        }
        set({
          tabs: [...tabs, { key, label, closable }],
          activeKey: key,
        });
      },

      removeTab: (key: string) => {
        const { tabs, activeKey } = get();
        const idx = tabs.findIndex((t) => t.key === key);
        if (idx === -1) return;

        const newTabs = tabs.filter((t) => t.key !== key);

        let newActiveKey = activeKey;
        if (activeKey === key) {
          // 激活左侧相邻标签
          const nextIdx = Math.max(0, idx - 1);
          newActiveKey = tabs[nextIdx]?.key ?? HOME_KEY;
        }

        set({ tabs: newTabs.length ? newTabs : [{ key: HOME_KEY, label: HOME_LABEL, closable: false }], activeKey: newActiveKey });
      },

      setActiveKey: (key: string) => set({ activeKey: key }),
    }),
    {
      name: 'sass-kb-tabs',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        tabs: state.tabs,
        activeKey: state.activeKey,
      }),
    }
  )
);
