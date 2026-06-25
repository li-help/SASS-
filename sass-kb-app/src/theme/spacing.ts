/**
 * 设计令牌 — 间距、圆角、阴影
 * 基于 4pt/8pt 网格系统
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const, color: '#1F1F1F' },
  h2: { fontSize: 20, fontWeight: '600' as const, color: '#1F1F1F' },
  h3: { fontSize: 17, fontWeight: '600' as const, color: '#1F1F1F' },
  body: { fontSize: 15, fontWeight: '400' as const, color: '#1F1F1F' },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: '#595959' },
  caption: { fontSize: 12, fontWeight: '400' as const, color: '#8C8C8C' },
  label: { fontSize: 13, fontWeight: '500' as const, color: '#1F1F1F' },
} as const;
