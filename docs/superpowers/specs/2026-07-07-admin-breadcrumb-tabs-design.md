# Admin 面包屑导航 + 标签栏切换 设计文档

## 概述

在 sass-kb-admin 管理后台增加面包屑导航和浏览器式标签栏切换功能，提升多页面操作体验。

## 技术栈

- React 19 + TypeScript
- Ant Design 6.4.5（Breadcrumb、Tabs 组件）
- react-router-dom v7（useMatches、useNavigate）
- Zustand v5（标签状态管理 + sessionStorage 持久化）

## 详细设计

### 1. 路由配置 — 面包屑元信息

在每个路由的 `handle` 中添加 `breadcrumb` 字段：

```ts
// routes/index.tsx
{
  path: 'dashboard',
  handle: { breadcrumb: '仪表盘' },
  element: <DashboardPage />,
},
{
  path: 'user',
  handle: { breadcrumb: '用户管理' },
  element: <UserPage />,
},
// ... 所有路由均添加
```

### 2. 标签状态管理 stores/tabStore.ts

新建 Zustand store，使用 sessionStorage 持久化：

```ts
interface TabItem {
  key: string;       // 路由 path（如 /dashboard）
  label: string;     // 标签显示名称（来自 breadcrumb）
  closable: boolean; // 是否可关闭
}

interface TabStore {
  tabs: TabItem[];
  activeKey: string;
  addTab: (tab: TabItem) => void;
  removeTab: (key: string) => void;
  setActiveKey: (key: string) => void;
}
```

行为：
- `addTab`：标签已存在则仅激活，不存在则新增并激活
- `removeTab`：关闭后自动激活左侧相邻标签
- 持久化到 sessionStorage，刷新页面后保留

### 3. 面包屑组件

集成在 MainLayout 中：
- 使用 react-router v7 的 `useMatches()` 获取当前路由匹配链
- 从 `handle.breadcrumb` 读取每级名称
- 渲染 Ant Design `<Breadcrumb>`
- 最后一项为当前页（不可点击），前面各项可点击跳转

### 4. 标签栏组件 components/tabs/TabBar.tsx

- 使用 Ant Design `<Tabs type="editable-card">`
- 从 tabStore 读取 tabs 和 activeKey
- 支持操作：切换标签（导航到对应路由）、关闭标签、右键菜单（关闭当前/关闭其他/关闭所有）
- 监听路由变化，自动同步 activeKey 并添加新标签

### 5. MainLayout 布局调整

```
┌──────────────────────────────────────┐
│ Header (collapse btn, notifications,  │
│        user dropdown)                 │
├──────────────────────────────────────┤
│ Breadcrumb (🏠 仪表盘 > 用户管理)      │
├──────────────────────────────────────┤
│ Tab Bar (仪表盘 | 用户管理 | 文件 ×)    │
├──────────────────────────────────────┤
│ Content (<Outlet />)                  │
└──────────────────────────────────────┘
```

面包屑和标签栏放置于 Header 和 Content 之间。

### 6. 涉及文件

| 文件 | 操作 |
|------|------|
| `routes/index.tsx` | 每个路由添加 `handle: { breadcrumb }` |
| `stores/tabStore.ts` | 新建 Zustand 标签状态管理 |
| `components/tabs/TabBar.tsx` | 新建标签栏组件 |
| `layouts/MainLayout.tsx` | 集成面包屑 + 标签栏，调整布局 |

## 边界情况

- 路由无 breadcrumb handle → 降级显示 path 最后一段
- 动态路由参数（如 `file/:id/preview`）→ breadcrumb 使用静态文本，不解析参数
- 仪表盘标签不可关闭（`closable: false`）
