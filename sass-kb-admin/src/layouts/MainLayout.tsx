import { Layout, Menu, Avatar, Dropdown, Badge, List, Typography, Button, Spin, theme } from 'antd';
import {
  DashboardOutlined, TeamOutlined, UserOutlined, FolderOpenOutlined,
  FileOutlined, SearchOutlined, SafetyOutlined, AuditOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { Suspense, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { notificationApi, type Notification } from '@/services/notificationApi';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/space', icon: <FolderOpenOutlined />, label: '知识空间' },
  { key: '/file', icon: <FileOutlined />, label: '文件管理' },
  { key: '/search', icon: <SearchOutlined />, label: '搜索' },
  { key: '/user', icon: <UserOutlined />, label: '用户管理' },
  { key: '/role', icon: <SafetyOutlined />, label: '角色权限' },
  { key: '/tenant', icon: <TeamOutlined />, label: '租户管理' },
  { key: '/audit', icon: <AuditOutlined />, label: '审计日志' },
  { key: '/permission', icon: <KeyOutlined />, label: '权限管理' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { realName, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const { token: { colorBgContainer } } = theme.useToken();

  // Notification bell
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationApi.unreadCount(),
    refetchInterval: 30_000, // poll every 30s
  });
  const unreadCount = unreadData?.data?.count || 0;

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationApi.list({ page: 1, size: 5 }),
  });

  const handleNotificationClick = (notif: Notification) => {
    notificationApi.markRead(notif.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    if (notif.targetType === 'doc' && notif.targetId) {
      navigate(`/space/any/doc/${notif.targetId}`);
    }
  };

  const handleMarkAllRead = () => {
    notificationApi.markAllRead().then(() => {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  };

  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 48, margin: 16, color: '#fff', fontSize: collapsed ? 14 : 18, fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {collapsed ? 'SKB' : 'SASS 知识平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: colorBgContainer, padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer', fontSize: 18 }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Notification Bell */}
            <Dropdown
              trigger={['click']}
              dropdownRender={() => (
                <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.08)', width: 340, padding: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 8px' }}>
                    <Text strong>通知</Text>
                    <Button type="link" size="small" onClick={handleMarkAllRead}>全部已读</Button>
                  </div>
                  {notifData?.data?.records?.length ? (
                    <List
                      size="small"
                      dataSource={notifData.data.records}
                      renderItem={(item: Notification) => (
                        <List.Item
                          style={{ cursor: 'pointer', background: item.isRead ? 'transparent' : '#f0f5ff', padding: '8px', borderRadius: 4 }}
                          onClick={() => handleNotificationClick(item)}
                        >
                          <List.Item.Meta
                            title={<Text style={{ fontWeight: item.isRead ? 'normal' : 600 }}>{item.title}</Text>}
                            description={<Text type="secondary" style={{ fontSize: 12 }}>{item.createdAt?.substring(0, 16)}</Text>}
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <Text type="secondary">暂无通知</Text>
                    </div>
                  )}
                </div>
              )}
            >
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
              </Badge>
            </Dropdown>

            {/* User */}
            <Dropdown menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout }] }}>
              <span style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                {realName}
              </span>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: 8, minHeight: 280 }}>
          <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '60px auto' }} />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}
