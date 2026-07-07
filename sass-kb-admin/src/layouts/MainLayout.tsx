import { Layout, Menu, Avatar, Dropdown, Badge, List, Typography, Button, Spin, theme, Breadcrumb, Tabs } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined, UserOutlined, HomeOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined,
} from '@ant-design/icons';
import { Suspense, useState, useMemo, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useMatches, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useTabStore } from '@/stores/tabStore';
import { notificationApi, type Notification } from '@/services/notificationApi';
import { userApi } from '@/services/authService';
import { menuApi } from '@/services/menuApi';
import type { Menu as MenuType } from '@/services/menuApi';
import { getIcon } from '@/utils/iconMap';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function treeToMenuItems(nodes: MenuType[]): MenuProps['items'] {
  return nodes
    .filter((n) => n.visible && n.status === '0')
    .map((n) => ({
      key: n.path || n.id,
      icon: getIcon(n.icon),
      label: n.name,
      children: n.children?.length ? treeToMenuItems(n.children) : undefined,
    }));
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const matches = useMatches();
  const { realName, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const { token } = theme.useToken();
  const { tabs, activeKey, addTab, removeTab, setActiveKey } = useTabStore();

  // 实时刷新
  useRealtimeRefresh();

  // 动态菜单
  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menuApi.tree(),
    staleTime: 5 * 60_000,
  });

  const { data: myRoles } = useQuery({
    queryKey: ['my-roles'],
    queryFn: () => userApi.myRoles(),
    staleTime: 5 * 60_000,
  });
  const isAdmin = myRoles?.data?.includes('管理员') ?? true;

  const menuItems = useMemo(
    () => {
      const all = treeToMenuItems(menuData?.data || []) || [];
      if (isAdmin) return all;
      return all.filter((m: any) => ['/dashboard', '/file'].includes(m?.key as string));
    },
    [menuData, isAdmin],
  );

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationApi.unreadCount(),
    refetchInterval: 30_000,
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
      // 文档页面已移除
    }
  };

  const handleMarkAllRead = () => {
    notificationApi.markAllRead().then(() => {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  };

  const selectedKey = '/' + location.pathname.split('/')[1];

  // ---- 面包屑 ----
  const breadcrumbItems = useMemo(() => {
    const items: { title: React.ReactNode; key: string }[] = [
      {
        title: (
          <Link to="/dashboard">
            <HomeOutlined />
          </Link>
        ),
        key: 'home',
      },
    ];

    for (const match of matches) {
      const handle = (match as any).handle as { breadcrumb?: string } | undefined;
      const pathname = match.pathname;
      if (!pathname || pathname === '/') continue;

      const label = handle?.breadcrumb ?? pathname.split('/').pop() ?? pathname;
      const isLast = pathname === location.pathname;

      items.push({
        title: isLast ? label : <Link to={pathname}>{label}</Link>,
        key: pathname,
      });
    }

    return items;
  }, [matches, location.pathname]);

  // ---- 标签栏同步 ----
  // 路由变化时自动添加标签
  useEffect(() => {
    const currentMatch = matches[matches.length - 1];
    if (!currentMatch) return;

    const handle = (currentMatch as any).handle as { breadcrumb?: string } | undefined;
    const pathname = currentMatch.pathname;
    if (!pathname || pathname === '/') return;

    const label = handle?.breadcrumb ?? pathname.split('/').pop() ?? pathname;
    const closable = pathname !== '/dashboard';
    addTab(pathname, label, closable);
  }, [location.pathname, matches, addTab]);

  // 点击标签时导航
  const handleTabChange = (key: string) => {
    setActiveKey(key);
    navigate(key);
  };

  // 关闭标签
  const handleTabRemove = (key: string) => {
    removeTab(key);
    const { activeKey: nextKey } = useTabStore.getState();
    // 如果关闭的是当前标签，导航到新激活的标签
    if (key === location.pathname) {
      navigate(nextKey);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={220}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 4,
        }}>
          <div style={{
            width: collapsed ? 32 : 36,
            height: collapsed ? 32 : 36,
            borderRadius: 8,
            background: token.colorPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: collapsed ? 0 : 10,
            flexShrink: 0,
          }}>
            <DashboardOutlined style={{ fontSize: collapsed ? 16 : 18, color: '#fff' }} />
          </div>
          {!collapsed && (
            <span style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 0.5,
              whiteSpace: 'nowrap',
            }}>
              SASS 知识平台
            </span>
          )}
        </div>
        {menuLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin size="small" />
          </div>
        ) : (
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ borderInlineEnd: 'none' }}
          />
        )}
      </Sider>
      <Layout>
        <Header style={{
          background: token.colorBgContainer,
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          zIndex: 1,
          position: 'relative',
        }}>
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
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = token.colorBgLayout)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Dropdown
              trigger={['click']}
              dropdownRender={() => (
                <div style={{
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                  width: 360,
                  padding: 8,
                  border: '1px solid #f0f0f0',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                    padding: '8px 12px',
                    borderBottom: '1px solid #f5f5f5',
                  }}>
                    <Text strong style={{ fontSize: 15 }}>通知</Text>
                    <Button type="link" size="small" onClick={handleMarkAllRead}>全部已读</Button>
                  </div>
                  {notifData?.data?.records?.length ? (
                    <List
                      size="small"
                      dataSource={notifData.data.records}
                      renderItem={(item: Notification) => (
                        <List.Item
                          style={{
                            cursor: 'pointer',
                            background: item.isRead ? 'transparent' : '#E8EFF5',
                            padding: '8px 12px',
                            borderRadius: 6,
                            marginBottom: 2,
                            border: 'none',
                          }}
                          onClick={() => handleNotificationClick(item)}
                        >
                          <List.Item.Meta
                            title={<Text style={{ fontWeight: item.isRead ? 400 : 600 }}>{item.title}</Text>}
                            description={<Text type="secondary" style={{ fontSize: 12 }}>{item.createdAt?.substring(0, 16)}</Text>}
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <Text type="secondary">暂无通知</Text>
                    </div>
                  )}
                </div>
              )}
            >
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: token.colorTextSecondary }} />
              </Badge>
            </Dropdown>

            <Dropdown menu={{ items: [
              { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
              { type: 'divider' as const },
              { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout },
            ] }}>
              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                <span style={{ color: token.colorText, fontWeight: 500 }}>{realName}</span>
              </span>
            </Dropdown>
          </div>
        </Header>

        {/* 面包屑 */}
        <div style={{
          background: token.colorBgContainer,
          padding: '12px 24px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* 标签栏 */}
        <div style={{
          background: token.colorBgContainer,
          padding: '0 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <Tabs
            type="editable-card"
            hideAdd
            activeKey={activeKey}
            onChange={handleTabChange}
            onEdit={(key, action) => {
              if (action === 'remove' && typeof key === 'string') {
                handleTabRemove(key);
              }
            }}
            items={tabs.map((t) => ({
              key: t.key,
              label: t.label,
              closable: t.closable,
            }))}
            style={{ marginBottom: 0 }}
            size="small"
          />
        </div>

        <Content style={{
          margin: 24,
          padding: 24,
          background: token.colorBgContainer,
          borderRadius: 10,
          minHeight: 280,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '60px auto' }} />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}
