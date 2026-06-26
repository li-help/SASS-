import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30s 内数据视为新鲜，避免重复请求
      gcTime: 5 * 60_000,      // 5 分钟垃圾回收
      retry: 1,                // 失败重试 1 次
      refetchOnWindowFocus: false, // 切换窗口不重新请求
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
