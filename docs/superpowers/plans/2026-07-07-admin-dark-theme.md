# Admin 暗色奢华主题美化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 sass-kb-admin 从默认浅色模板升级为暗色奢华风格：深墨蓝底 + 古铜金强调色。

**Architecture:** Ant Design 6 `darkAlgorithm` 作为基底，通过 token 覆盖注入金色强调色 + 组件级 theme 微调；少量自定义 CSS 处理毛玻璃、侧边栏金线、卡片 hover 浮起等算法覆盖不到的效果。

**Tech Stack:** React 19, TypeScript, Ant Design 6.4.5 (darkAlgorithm, ConfigProvider theme), CSS

## Global Constraints

- 侧边栏 `#080F1A`，选中项金色左边框 + 金色文字
- 内容区背景 `#0F1923`，面板 `#162231`，卡片 `#1C2B3F`
- 强调色 `#C8963E` 古铜金，辅助金 `#E8C97A`
- 文字主 `#E8ECF1` 暖白，文字辅 `#8FA0B8` 蓝灰
- Header 毛玻璃效果 (`backdrop-filter: blur(12px)`)
- 卡片 hover：金色边框增强 + 上浮 (`translateY(-2px)`) + 阴影
- 按钮主色金色，表格行 hover 微金背景
- 构建通过：`npm run build`

---

### Task 1: 全局暗色主题配置 + 基础样式

**Files:**
- Modify: `sass-kb-admin/src/App.tsx`
- Modify: `sass-kb-admin/src/index.css`

- [ ] **Step 1: 重写 App.tsx 主题配置**

完整替换 `App.tsx` 中的 `themeConfig`：

```tsx
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
```

- [ ] **Step 2: 重写 index.css 全局暗色样式**

完整替换 `index.css`：

```css
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #0F1923;
  color: #E8ECF1;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(200, 150, 62, 0.25);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(200, 150, 62, 0.45);
}

/* 毛玻璃 */
.glass {
  background: rgba(22, 35, 49, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* 卡片 hover 浮起 */
.card-lift {
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.card-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  border-color: rgba(200, 150, 62, 0.30);
}
```

- [ ] **Step 3: 验证编译 + 提交**

Run: `cd sass-kb-admin && npm run build`
Expected: 构建成功

```bash
git add sass-kb-admin/src/App.tsx sass-kb-admin/src/index.css
git commit -m "feat: apply dark luxury theme config and global styles"
```

---

### Task 2: MainLayout 暗色适配

**Files:**
- Modify: `sass-kb-admin/src/layouts/MainLayout.tsx`

**Interfaces:**
- Consumes: dark theme tokens from Task 1 (via `theme.useToken()`)

- [ ] **Step 1: 调整 MainLayout 各区域样式**

关键改动点：

**(a) 侧边栏 Logo 区** — 金色图标 + 底部金色微光分隔线：

```tsx
<div style={{
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid rgba(200,150,62,0.15)',
  marginBottom: 4,
}}>
  <div style={{
    width: collapsed ? 32 : 36,
    height: collapsed ? 32 : 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #C8963E, #A67C2E)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: collapsed ? 0 : 10,
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(200,150,62,0.30)',
  }}>
    <DashboardOutlined style={{ fontSize: collapsed ? 16 : 18, color: '#fff' }} />
  </div>
  {!collapsed && (
    <span style={{
      color: '#E8ECF1',
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: 1,
      whiteSpace: 'nowrap',
      background: 'linear-gradient(135deg, #E8C97A, #C8963E)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }}>
      SASS 知识平台
    </span>
  )}
</div>
```

**(b) 菜单选中项** — 保持现有 Menu 组件 theme="dark"，由 Task 1 的 Menu token 控制金色选中态。

**(c) Header** — 毛玻璃效果 + 金色分隔线：

```tsx
<Header style={{
  background: 'rgba(22,35,49,0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  padding: '0 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 1px 0 rgba(200,150,62,0.08), 0 2px 8px rgba(0,0,0,0.20)',
  zIndex: 1,
  position: 'relative',
  borderBottom: '1px solid rgba(200,150,62,0.10)',
}}>
```

Header 内折叠按钮 hover 色改为金色：

```tsx
<span
  onClick={() => setCollapsed(!collapsed)}
  style={{
    cursor: 'pointer',
    fontSize: 18,
    color: token.colorTextSecondary,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    transition: 'background 0.2s, color 0.2s',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'rgba(200,150,62,0.10)';
    e.currentTarget.style.color = '#C8963E';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = token.colorTextSecondary;
  }}
>
  {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
</span>
```

**(d) 用户头像** — 金色边框：

```tsx
<Avatar
  size={32}
  icon={<UserOutlined />}
  style={{
    backgroundColor: 'transparent',
    border: '1.5px solid #C8963E',
    color: '#C8963E',
  }}
/>
```

**(e) 面包屑区域** — 暗色背景适配：

```tsx
<div style={{
  background: token.colorBgContainer,
  padding: '12px 24px',
  borderBottom: `1px solid ${token.colorBorderSecondary}`,
}}>
  <Breadcrumb items={breadcrumbItems} />
</div>
```

**(f) 标签栏区域** — 保持结构，配色由 Task 1 的 Tabs token 控制：

```tsx
<div style={{
  background: token.colorBgContainer,
  padding: '0 16px',
  borderBottom: `1px solid ${token.colorBorderSecondary}`,
}}>
  <Tabs ... />
</div>
```

**(g) Content 区域** — 背景改用透明让 layout 底色透出：

```tsx
<Content style={{
  margin: 24,
  padding: 24,
  background: token.colorBgContainer,
  borderRadius: 10,
  minHeight: 280,
  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
}}>
```

- [ ] **Step 2: 验证编译 + 提交**

Run: `cd sass-kb-admin && npm run build`
Expected: 构建成功

```bash
git add sass-kb-admin/src/layouts/MainLayout.tsx
git commit -m "feat: adapt MainLayout to dark luxury theme"
```

---

### Task 3: Dashboard 统计卡片暗色适配

**Files:**
- Modify: `sass-kb-admin/src/pages/dashboard/index.tsx`

- [ ] **Step 1: 调整统计卡片配色**

将 `statConfig` 中的图标背景色改为暗色适配版本：

```tsx
const statConfig = [
  { key: 'files', title: '文件资源', icon: <FileOutlined />, color: '#E8C97A', bg: 'rgba(200,150,62,0.12)' },
  { key: 'users', title: '用户数', icon: <UserOutlined />, color: '#B388FF', bg: 'rgba(179,136,255,0.12)' },
  { key: 'tenants', title: '租户数', icon: <TeamOutlined />, color: '#64B5F6', bg: 'rgba(100,181,246,0.12)' },
];
```

标题和描述文字适配暗色：

```tsx
<div style={{ marginBottom: 24 }}>
  <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#E8ECF1' }}>工作台</Title>
  <Text type="secondary" style={{ fontSize: 15 }}>欢迎使用 SASS 知识平台</Text>
</div>
```

Statistic 数值颜色改为暖白：

```tsx
<Statistic
  value={stats?.[cfg.key] ?? '-'}
  valueStyle={{ fontSize: 26, fontWeight: 700, color: '#E8ECF1' }}
/>
```

- [ ] **Step 2: 验证编译 + 提交**

Run: `cd sass-kb-admin && npm run build`
Expected: 构建成功

```bash
git add sass-kb-admin/src/pages/dashboard/index.tsx
git commit -m "feat: adapt dashboard stat cards to dark theme"
```

---

### Task 4: 最终构建验证

- [ ] **Step 1: 运行生产构建**

Run: `cd sass-kb-admin && npm run build`
Expected: 构建成功，无错误

- [ ] **Step 2: 提交（如有修复）**

如有构建问题，修复后提交。
