import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  if (__DEV__) {
    // Android 模拟器通过 10.0.2.2 访问宿主机
    // iOS 模拟器直接使用 localhost
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:8080/api'
      : 'http://localhost:8080/api';
  }
  // Web 生产环境：使用相对路径，由 nginx 代理到后端
  if (Platform.OS === 'web') {
    return '/api';
  }
  // 原生 App 生产环境地址
  // 发布前：设置 EXPO_PUBLIC_API_URL 环境变量，或直接替换为实际地址
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'https://your-production-api.com/api';
};

export const API_BASE_URL = getBaseUrl();
