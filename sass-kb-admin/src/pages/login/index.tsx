import { Button, Form, Input, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const onFinish = async (values: { account: string; password: string }) => {
    try {
      await login(values.account, values.password);
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (e: unknown) {
      message.error((e as Error).message || '登录失败');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 左侧品牌区 */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0B1A2E 0%, #1E3A5F 50%, #2D5F8A 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 装饰背景 */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -60,
          left: -40,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />

        <div style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: 'rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          zIndex: 1,
        }}>
          <FolderOpenOutlined style={{ fontSize: 40, color: '#fff' }} />
        </div>
        <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: 1, zIndex: 1 }}>
          SASS 知识平台
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, marginTop: 12, zIndex: 1 }}>
          企业知识库管理系统
        </Text>
        <div style={{ marginTop: 48, zIndex: 1 }}>
          {['高效文档协作', '灵活权限管控', '安全知识沉淀'].map((text, i) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, color: 'rgba(255,255,255,0.55)' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'rgba(255,255,255,0.4)',
              }} />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>{text}</Text>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#F0F2F5',
        padding: 40,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>欢迎回来</Title>
            <Text type="secondary" style={{ fontSize: 15, marginTop: 8, display: 'block' }}>
              登录您的账号以继续
            </Text>
          </div>
          <Form onFinish={onFinish} size="large">
            <Form.Item name="account" rules={[{ required: true, message: '请输入账号' }]}>
              <Input prefix={<UserOutlined />} placeholder="账号" style={{ height: 48 }} />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" style={{ height: 48 }} />
            </Form.Item>
            <Form.Item style={{ marginTop: 8 }}>
              <Button type="primary" htmlType="submit" block style={{ height: 48, fontSize: 16, fontWeight: 600, borderRadius: 8 }}>
                登 录
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">还没有账号？</Text>
              <Link to="/register" style={{ fontWeight: 500 }}>立即注册</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
