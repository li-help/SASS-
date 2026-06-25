import { RouterProvider } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';
import { router } from '@/routes';
import ErrorBoundary from '@/components/ErrorBoundary';

const themeConfig = {
  token: {
    colorPrimary: '#1E3A5F',
    colorSuccess: '#389E0D',
    colorWarning: '#D48806',
    colorError: '#CF1322',
    colorInfo: '#1E3A5F',
    borderRadius: 6,
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F0F2F5',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    colorText: '#1F1F1F',
    colorTextSecondary: '#595959',
    colorTextTertiary: '#8C8C8C',
    colorBorder: '#E8E8E8',
    colorBorderSecondary: '#F0F0F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.08)',
  },
  components: {
    Layout: {
      siderBg: '#0B1A2E',
      triggerBg: '#0F2238',
      headerBg: '#FFFFFF',
    },
    Menu: {
      darkItemBg: '#0B1A2E',
      darkItemSelectedBg: '#1E3A5F',
      darkItemHoverBg: 'rgba(255,255,255,0.06)',
      darkSubMenuItemBg: '#0B1A2E',
    },
    Card: {
      borderRadiusLG: 10,
    },
    Table: {
      headerBg: '#F7F8FA',
      rowHoverBg: '#E8EFF5',
    },
  },
};

export default function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </AntApp>
    </ConfigProvider>
  );
}
