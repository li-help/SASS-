import { Typography, Card, Row, Col, Statistic } from 'antd';
import { FileOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/authService';

const { Title, Text } = Typography;

const statConfig = [
  { key: 'files', title: '文件资源', icon: <FileOutlined />, color: '#E8C97A', bg: 'rgba(200,150,62,0.12)' },
  { key: 'users', title: '用户数', icon: <UserOutlined />, color: '#B388FF', bg: 'rgba(179,136,255,0.12)' },
  { key: 'tenants', title: '租户数', icon: <TeamOutlined />, color: '#64B5F6', bg: 'rgba(100,181,246,0.12)' },
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
        <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#E8ECF1' }}>工作台</Title>
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
                  <div style={{ fontSize: 13, color: '#8FA0B8', marginBottom: 2 }}>{cfg.title}</div>
                  <Statistic
                    value={stats?.[cfg.key] ?? '-'}
                    valueStyle={{ fontSize: 26, fontWeight: 700, color: '#E8ECF1' }}
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
