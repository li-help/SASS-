/**
 * 设计令牌 — 色彩系统
 * 商务专业风格，深蓝主色调
 */
export const colors = {
  // 主色
  primary: '#1E3A5F',
  primaryHover: '#2D5F8A',
  primaryLight: '#E8EFF5',
  primaryDark: '#162D4A',

  // 语义色
  success: '#389E0D',
  successLight: '#F0FBE6',
  warning: '#D48806',
  warningLight: '#FFFBE6',
  error: '#CF1322',
  errorLight: '#FFF1F0',

  // 背景
  bgPage: '#F0F2F5',
  bgCard: '#FFFFFF',
  bgInput: '#FAFAFA',

  // 文字
  textPrimary: '#1F1F1F',
  textSecondary: '#595959',
  textTertiary: '#8C8C8C',
  textInverse: '#FFFFFF',

  // 边框
  border: '#E8E8E8',
  borderLight: '#F0F0F0',

  // 侧边栏
  sidebarBg: '#0B1A2E',
  sidebarText: '#B0BEC5',
  sidebarActive: '#FFFFFF',
} as const;
