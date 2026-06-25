# UI 整体美化设计方案

**日期**: 2026-06-25
**状态**: 已确认
**范围**: sass-kb-app（移动端）+ sass-kb-admin（管理后台）

---

## 1. 设计目标

将 SASS 知识平台从功能优先的朴素界面，升级为商务专业风格的企业级 SaaS 产品外观。

**关键词**: 稳重、专业、清晰层级、企业 SaaS 质感

---

## 2. 设计令牌 (Design Tokens)

### 2.1 色彩系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-primary` | `#1E3A5F` | 主色（深蓝，替代 `#1677ff`） |
| `--color-primary-hover` | `#2D5F8A` | hover / 选中态 |
| `--color-primary-light` | `#E8EFF5` | 主色浅背景 |
| `--color-success` | `#389E0D` | 成功状态 |
| `--color-warning` | `#D48806` | 警告状态 |
| `--color-error` | `#CF1322` | 错误状态 |
| `--color-bg-page` | `#F0F2F5` | 页面背景 |
| `--color-bg-card` | `#FFFFFF` | 卡片背景 |
| `--color-text-primary` | `#1F1F1F` | 主文字 |
| `--color-text-secondary` | `#595959` | 次要文字 |
| `--color-text-tertiary` | `#8C8C8C` | 辅助/占位文字 |
| `--color-border` | `#E8E8E8` | 边框线 |

### 2.2 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | 6px | 按钮、标签 |
| `--radius-md` | 8px | 卡片、输入框 |
| `--radius-lg` | 12px | 模态框、大卡片 |

### 2.3 阴影

| Token | 值 | 用途 |
|-------|-----|------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | 卡片默认 |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | 卡片悬浮 |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.10)` | 模态框 |

### 2.4 间距

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-xs` | 4px | 紧凑间距 |
| `--space-sm` | 8px | 小间距 |
| `--space-md` | 16px | 标准间距 |
| `--space-lg` | 24px | 大间距 |
| `--space-xl` | 32px | 超大间距 |

---

## 3. 移动端改动计划 (sass-kb-app)

### 3.1 新建共享主题文件

**文件**: `src/theme/colors.ts` — 集中管理色彩常量
**文件**: `src/theme/spacing.ts` — 集中管理间距、圆角、阴影常量
**文件**: `src/theme/index.ts` — 导出所有 token

各屏幕文件从主题文件引入颜色，不再硬编码。

### 3.2 逐屏修改

#### 3.2.1 LoginScreen / RegisterScreen
- 背景色：`#F0F2F5` → `--color-bg-page`
- 标题色：`#1890ff` → `--color-primary`
- 输入框：增加聚焦态边框色变化，微阴影
- 按钮：主色 `--color-primary`，增加微阴影
- 顶部增加品牌 logo 区域（使用文字+图标组合，不用 emoji）

#### 3.2.2 HomeScreen
- 欢迎卡：`#1677ff` → `--color-primary`，增加细微渐变（`--color-primary` → `--color-primary-hover`）
- 统计卡片：增加 `--shadow-sm`，数字使用 `--color-primary`
- 快捷操作：图标从 emoji 改为 Unicode 符号（如 ▸ 替代 ›）
- 知识空间列表项：增加分隔线和悬浮效果

#### 3.2.3 SpaceListScreen
- 空间卡片：增加 `--shadow-sm`，圆角 `--radius-lg`
- 文件夹图标从 emoji 📁📄 改为 Unicode 或文字图标
- 模态框：优化遮罩透明度，增加 `--shadow-lg`
- 操作按钮：调整为主色

#### 3.2.4 DocDetailScreen
- Header 增加底部分隔阴影
- 只读标签优化配色
- Tab 切换增加过渡动效
- WebView 内容样式继承 token 色值

#### 3.2.5 其余屏幕（DocCreateScreen, DocEditScreen, FileListScreen, FilePreviewScreen, SearchScreen, ProfileScreen, NotificationScreen, VersionListScreen, CommentList）
- 统一替换颜色引用
- 统一卡片样式（shadow-sm + radius-md）
- 统一按钮样式

### 3.3 全局改动
- 所有 `StyleSheet.create` 中的硬编码色值替换为主题引用
- emoji 图标统一替换为更专业的 Unicode 字符
- ActivityIndicator 颜色统一为 `--color-primary`

---

## 4. 管理后台改动计划 (sass-kb-admin)

### 4.1 ConfigProvider 全局主题

**文件**: `src/main.tsx` 或 `src/App.tsx`

通过 Ant Design 的 `ConfigProvider` 注入主题 token：

```tsx
// 关键 token 覆盖
{
  colorPrimary: '#1E3A5F',
  borderRadius: 6,
  colorBgContainer: '#FFFFFF',
  colorBgLayout: '#F0F2F5',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}
```

### 4.2 布局优化

**MainLayout.tsx**:
- 侧边栏：深色背景 `#001529` → `#0B1A2E`（更深邃的深蓝黑）
- 侧边栏 logo 区域：增加底部边线分隔
- Header：增加底部微阴影 (`box-shadow: 0 1px 4px rgba(0,0,0,0.06)`)
- 通知下拉：优化卡片样式，未读项背景改用 `--color-primary-light`

### 4.3 逐页修改

#### 4.3.1 LoginPage / RegisterPage
- 左侧增加品牌展示区：深蓝背景 + 平台名称 + 简短描述
- 右侧登录表单保持整洁
- 卡片增加微阴影

#### 4.3.2 DashboardPage
- 统计卡片：图标背景使用对应语义色的浅色版，增加数字动画
- "最近文档"卡片：优化列表项悬浮效果

#### 4.3.3 SpacePage
- 空间卡片：增加 hover 时的阴影提升效果（已使用 `hoverable`，微调阴影
- 创建/编辑模态框：表单布局优化（已使用 `layout="vertical"`，OK）

#### 4.3.4 其余页面（doc, file, search, user, role, tenant, audit, permission）
- 统一表格行悬浮背景色
- 统一页面标题样式
- 操作按钮间距统一

### 4.4 全局改动
- 表格行 hover 背景色使用 `--color-primary-light`
- Tag/Badge 颜色映射统一
- 分页器样式微调

---

## 5. 实施策略

1. **先建 Token**：移动端建 theme 文件，管理后台建 ConfigProvider 配置
2. **先改共享组件**：布局、通用组件
3. **再由外向内改页面**：登录 → 首页/工作台 → 列表 → 详情
4. **每改一页验证一页**：确保功能不受影响

### 约束
- 不修改任何业务逻辑
- 不修改 API 调用
- 不引入新的 UI 库
- 移动端使用 React Native StyleSheet（不引入 styled-components 等额外依赖）
- 管理后台仅通过 ConfigProvider + 内联 style 调整（不覆盖 Ant Design 默认样式文件）

---

## 6. 成功标准

- [ ] 移动端 8+ 屏幕颜色统一，无硬编码色值
- [ ] 管理后台 10+ 页面统一使用新主题
- [ ] 两端均无 emoji 图标（管理后台已有 Ant Design 图标，OK）
- [ ] 卡片阴影、圆角、间距统一
- [ ] 登录/注册页品牌感明显提升
- [ ] 所有现有功能不受影响
