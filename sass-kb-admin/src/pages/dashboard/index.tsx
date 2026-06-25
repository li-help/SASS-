import { Typography, Card, Row, Col, List, Tag, Statistic } from 'antd';
import {
  FolderOpenOutlined, FileTextOutlined, FileOutlined,
  UserOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '@/services/authService';

const { Title, Text } = Typography;

const statConfig = [
  { key: 'spaces', title: '知识空间', icon: <FolderOpenOutlined />, color: '#1E3A5F', bg: '#E8EFF5' },
  { key: 'docs', title: '文档总数', icon: <FileTextOutlined />, color: '#389E0D', bg: '#F0FBE6' },
  { key: 'files', title: '文件资源', icon: <FileOutlined />, color: '#D48806', bg: '#FFFBE6' },
  { key: 'users', title: '用户数', icon: <UserOutlined />, color: '#722ED1', bg: '#F9F0FF' },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats(),
  });

  const stats = data?.data;
  const recentDocs = stats?.recentDocs || [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 700 }}>工作台</Title>
        <Text type="secondary" style={{ fontSize: 15 }}>欢迎使用 SASS 知识平台</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {statConfig.map((cfg) => (
          <Col xs={12} sm={12} md={6} key={cfg.key}>
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
                    value={(stats as any)?.[cfg.key] ?? '-'}
                    valueStyle={{ fontSize: 26, fontWeight: 700, color: '#1F1F1F' }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 最近文档 */}
      <Card
        title={<span style={{ fontWeight: 600, fontSize: 16 }}>最近更新的文档</span>}
        style={{ borderRadius: 10 }}
        loading={isLoading}
        extra={
          <a onClick={() => navigate('/space')} style={{ fontSize: 14, fontWeight: 500 }}>
            查看全部 <ArrowRightOutlined />
          </a>
        }
      >
        {recentDocs.length > 0 ? (
          <List
            size="small"
            dataSource={recentDocs}
            renderItem={(doc) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                onClick={() => navigate(`/doc/${doc.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F8FA')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <List.Item.Meta
                  avatar={
                    <FileTextOutlined style={{ fontSize: 20, color: '#1E3A5F' }} />
                  }
                  title={
                    <span>
                      {doc.title || '无标题'}
                      <Tag
                        color={doc.status === 'published' ? 'green' : doc.status === 'draft' ? 'gold' : 'default'}
                        style={{ marginLeft: 8, fontSize: 11, borderRadius: 4 }}
                      >
                        {doc.status === 'published' ? '已发布' : doc.status === 'draft' ? '草稿' : doc.status}
                      </Tag>
                    </span>
                  }
                  description={
                    doc.updatedAt
                      ? `更新于 ${new Date(doc.updatedAt).toLocaleString('zh-CN')}`
                      : '-'
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: '#8C8C8C' }}>
            暂无文档，去<Text type="secondary" style={{ cursor: 'pointer' }}><a onClick={() => navigate('/space')}>知识空间</a></Text>创建
          </div>
        )}
      </Card>
    </div>
  );
}
