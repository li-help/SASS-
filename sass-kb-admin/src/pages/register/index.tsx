import { Button, Form, Input, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, TeamOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/services/authService';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: Record<string, string>) => {
    try {
      await authApi.register(values);
      message.success('注册成功，请登录');
      navigate('/login', { replace: true });
    } catch (e: unknown) {
      message.error((e as Error).message || '注册失败');
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
          创建您的账号，开始知识管理之旅
        </Text>
      </div>

      {/* 右侧注册表单 */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#F0F2F5',
        padding: 40,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>用户注册</Title>
            <Text type="secondary" style={{ fontSize: 15, marginTop: 8, display: 'block' }}>
              注册后自动创建您的专属知识空间
            </Text>
          </div>
          <Form form={form} onFinish={onFinish} size="large" layout="vertical">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3位' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" style={{ height: 46 }} />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" style={{ height: 46 }} />
            </Form.Item>
            <Form.Item name="realName" label="姓名（选填）">
              <Input prefix={<UserOutlined />} placeholder="您的真实姓名" style={{ height: 46 }} />
            </Form.Item>
            <Form.Item name="email" label="邮箱（选填）">
              <Input prefix={<MailOutlined />} placeholder="邮箱地址" style={{ height: 46 }} />
            </Form.Item>
            <Form.Item name="phone" label="手机号（选填）">
              <Input prefix={<PhoneOutlined />} placeholder="手机号码" style={{ height: 46 }} />
            </Form.Item>
            <Form.Item name="companyName" label="公司/组织名称（选填）">
              <Input prefix={<TeamOutlined />} placeholder="不填则加入默认租户" style={{ height: 46 }} />
            </Form.Item>
            <Form.Item style={{ marginTop: 8 }}>
              <Button type="primary" htmlType="submit" block style={{ height: 48, fontSize: 16, fontWeight: 600, borderRadius: 8 }}>
                注 册
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">已有账号？</Text>
              <Link to="/login" style={{ fontWeight: 500 }}>立即登录</Link>
              <Text type="secondary" style={{ margin: '0 8px' }}>|</Text>
              <Link to="/onboarding" style={{ fontWeight: 500 }}>商家入驻</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
