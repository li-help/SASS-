import type { ReactNode } from 'react';
import {
  DashboardOutlined, TeamOutlined, UserOutlined,
  FolderOpenOutlined, FileOutlined, SafetyOutlined, AuditOutlined,
  KeyOutlined, ShopOutlined, MenuOutlined,
  SettingOutlined, BellOutlined, LinkOutlined, StarOutlined,
  AppstoreOutlined, DatabaseOutlined, CloudOutlined, ToolOutlined,
  LockOutlined, UnlockOutlined, EyeOutlined, EditOutlined,
  DeleteOutlined, SearchOutlined, PlusOutlined, HomeOutlined,
} from '@ant-design/icons';

const iconMap: Record<string, ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  TeamOutlined: <TeamOutlined />,
  UserOutlined: <UserOutlined />,
  FolderOpenOutlined: <FolderOpenOutlined />,
  FileOutlined: <FileOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  AuditOutlined: <AuditOutlined />,
  KeyOutlined: <KeyOutlined />,
  ShopOutlined: <ShopOutlined />,
  MenuOutlined: <MenuOutlined />,
  SettingOutlined: <SettingOutlined />,
  BellOutlined: <BellOutlined />,
  LinkOutlined: <LinkOutlined />,
  StarOutlined: <StarOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  CloudOutlined: <CloudOutlined />,
  ToolOutlined: <ToolOutlined />,
  LockOutlined: <LockOutlined />,
  UnlockOutlined: <UnlockOutlined />,
  EyeOutlined: <EyeOutlined />,
  EditOutlined: <EditOutlined />,
  DeleteOutlined: <DeleteOutlined />,
  SearchOutlined: <SearchOutlined />,
  PlusOutlined: <PlusOutlined />,
  HomeOutlined: <HomeOutlined />,
};

export function getIcon(name?: string): ReactNode {
  if (!name) return null;
  return iconMap[name] ?? null;
}
