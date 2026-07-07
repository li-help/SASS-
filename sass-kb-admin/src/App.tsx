import { RouterProvider } from 'react-router-dom';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import { router } from '@/routes';
import ErrorBoundary from '@/components/ErrorBoundary';

const themeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#C8963E',
    colorSuccess: '#5B9A4B',
    colorWarning: '#D4A843',
    colorError: '#D1493F',
    colorInfo: '#C8963E',
    borderRadius: 8,
    colorBgBase: '#0F1923',
    colorBgContainer: '#162231',
    colorBgElevated: '#1C2B3F',
    colorBgLayout: '#0F1923',
    colorText: '#E8ECF1',
    colorTextSecondary: '#8FA0B8',
    colorTextTertiary: '#5C6F85',
    colorBorder: 'rgba(200,150,62,0.12)',
    colorBorderSecondary: 'rgba(200,150,62,0.08)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    boxShadow: '0 2px 8px rgba(0,0,0,0.30)',
    boxShadowSecondary: '0 4px 16px rgba(0,0,0,0.40)',
    colorLink: '#E8C97A',
    colorLinkHover: '#C8963E',
  },
  components: {
    Layout: {
      siderBg: '#080F1A',
      triggerBg: '#0C1522',
      headerBg: 'rgba(22,35,49,0.85)',
      bodyBg: '#0F1923',
    },
    Menu: {
      darkItemBg: '#080F1A',
      darkItemSelectedBg: 'rgba(200,150,62,0.10)',
      darkItemSelectedColor: '#C8963E',
      darkItemHoverBg: 'rgba(200,150,62,0.06)',
      darkSubMenuItemBg: '#080F1A',
      darkItemColor: '#8FA0B8',
      itemBorderRadius: 6,
      itemMarginInline: 8,
    },
    Card: {
      borderRadiusLG: 12,
      colorBgContainer: '#1C2B3F',
      colorBorderSecondary: 'rgba(200,150,62,0.10)',
    },
    Table: {
      headerBg: '#162231',
      headerColor: '#C8963E',
      rowHoverBg: 'rgba(200,150,62,0.06)',
      borderColor: 'rgba(200,150,62,0.08)',
      colorBgContainer: '#1C2B3F',
    },
    Breadcrumb: {
      lastItemColor: '#C8963E',
      linkColor: '#8FA0B8',
      linkHoverColor: '#E8C97A',
      separatorColor: '#5C6F85',
    },
    Tabs: {
      cardBg: '#162231',
      itemColor: '#8FA0B8',
      itemActiveColor: '#C8963E',
      itemHoverColor: '#E8C97A',
      itemSelectedColor: '#C8963E',
    },
    Button: {
      defaultBg: '#162231',
      defaultBorderColor: 'rgba(200,150,62,0.20)',
      defaultColor: '#8FA0B8',
      defaultHoverBorderColor: '#C8963E',
      defaultHoverColor: '#E8C97A',
    },
    Input: {
      colorBgContainer: '#162231',
      activeBorderColor: '#C8963E',
      hoverBorderColor: '#E8C97A',
      activeShadow: '0 0 0 2px rgba(200,150,62,0.15)',
    },
    Select: {
      colorBgContainer: '#162231',
      optionSelectedBg: 'rgba(200,150,62,0.12)',
      optionSelectedColor: '#C8963E',
    },
    Modal: {
      colorBgElevated: '#1C2B3F',
      headerBg: '#1C2B3F',
      contentBg: '#1C2B3F',
    },
    Tag: {
      defaultBg: 'rgba(200,150,62,0.08)',
      defaultColor: '#C8963E',
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
