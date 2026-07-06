import { Typography, Card, Row, Col, Statistic } from 'antd';
import { FileOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/authService';

const { Title, Text } = Typography;

const statConfig = [
  { key: 'files', title: '文件资源', icon: <FileOutlined />, color: '#D48806', bg: '#FFFBE6' },
  { key: 'users', title: '用户数', icon: <UserOutlined />, color: '#722ED1', bg: '#F9F0FF' },
  { key: 'tenants', title: '租户数', icon: <TeamOutlined />, color: '#1E3A5F', bg: '#E8EFF5' },
];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats(),
    refetchInterval: 30_000,
  });

  const stats = data?.data as Record<string, number> | undefined;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 700 }}>工作台</Title>
        <Text type="secondary" style={{ fontSize: 15 }}>欢迎使用 SASS 知识平台</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {statConfig.map((cfg) => (
          <Col xs={12} sm={8} md={8} key={cfg.key}>
            <Card
              loading={isLoading}
              style={{ borderRadius: 10 }}
              styles={{ body: { padding: '20px 24px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: cfg.bg,
                  color: cfg.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}>
                  {cfg.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#8C8C8C', marginBottom: 2 }}>{cfg.title}</div>
                  <Statistic
                    value={stats?.[cfg.key] ?? '-'}
                    valueStyle={{ fontSize: 26, fontWeight: 700, color: '#1F1F1F' }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
