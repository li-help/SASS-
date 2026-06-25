import { Typography, Card, Row, Col, List, Tag, Statistic } from 'antd';
import {
  FolderOpenOutlined, FileTextOutlined, FileOutlined,
  UserOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '@/services/authService';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats(),
  });

  const stats = data?.data;

  const statCards = [
    { title: '知识空间', value: stats?.spaces ?? '-', icon: <FolderOpenOutlined />, color: '#1677ff', bg: '#e6f4ff' },
    { title: '文档总数', value: stats?.docs ?? '-', icon: <FileTextOutlined />, color: '#52c41a', bg: '#f6ffed' },
    { title: '文件资源', value: stats?.files ?? '-', icon: <FileOutlined />, color: '#fa8c16', bg: '#fff7e6' },
    { title: '用户数', value: stats?.users ?? '-', icon: <UserOutlined />, color: '#722ed1', bg: '#f9f0ff' },
  ];

  const recentDocs = stats?.recentDocs || [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>工作台</Title>
        <Text type="secondary">欢迎使用 SASS 知识平台</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {statCards.map((card) => (
          <Col xs={12} sm={12} md={6} key={card.title}>
            <Card loading={isLoading} style={{ borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: card.bg, color: card.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {card.icon}
                </div>
                <Statistic title={card.title} value={card.value} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 最近文档 */}
      <Card
        title="最近更新的文档"
        style={{ borderRadius: 10 }}
        loading={isLoading}
        extra={
          <a onClick={() => navigate('/space')} style={{ fontSize: 13 }}>
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
                style={{ cursor: 'pointer', padding: '10px 0' }}
                onClick={() => navigate(`/doc/${doc.id}`)}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ fontSize: 18, color: '#1677ff' }} />}
                  title={
                    <span>
                      {doc.title || '无标题'}
                      <Tag color={doc.status === 'published' ? 'green' : doc.status === 'draft' ? 'gold' : 'default'} style={{ marginLeft: 8, fontSize: 11 }}>
                        {doc.status === 'published' ? '已发布' : doc.status === 'draft' ? '草稿' : doc.status}
                      </Tag>
                    </span>
                  }
                  description={doc.updatedAt ? `更新于 ${new Date(doc.updatedAt).toLocaleString('zh-CN')}` : '-'}
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
            暂无文档，去<Text type="secondary"><a onClick={() => navigate('/space')}>知识空间</a></Text>创建
          </div>
        )}
      </Card>
    </div>
  );
}
