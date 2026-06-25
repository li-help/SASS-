import { Button, Form, Input, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, ShopOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: {
    username: string;
    password: string;
    realName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
  }) => {
    try {
      const res = await api.post<any, any>('/auth/register', values);
      if (res.code === 200) {
        message.success(res.data || '注册成功，请登录');
        navigate('/login', { replace: true });
      } else {
        message.error(res.message || '注册失败');
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message || '注册失败，请稍后重试');
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
        <div style={{ position: 'absolute', top: -120, right: -100, width: 440, height: 440, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28, zIndex: 1,
        }}>
          <FolderOpenOutlined style={{ fontSize: 40, color: '#fff' }} />
        </div>
        <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: 1, zIndex: 1 }}>
          SASS 知识平台
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, marginTop: 12, zIndex: 1 }}>
          开启您的知识管理之旅
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
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>注册账号</Title>
            <Text type="secondary" style={{ fontSize: 15, marginTop: 8, display: 'block' }}>
              创建您的 SASS 知识平台账号
            </Text>
          </div>
          <Form form={form} onFinish={onFinish} size="large" layout="vertical">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少 3 个字符' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" style={{ height: 44 }} />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少 6 个字符' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" style={{ height: 44 }} />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" style={{ height: 44 }} />
            </Form.Item>
            <Form.Item name="realName">
              <Input prefix={<IdcardOutlined />} placeholder="真实姓名（选填）" style={{ height: 44 }} />
            </Form.Item>
            <Form.Item name="email" rules={[{ type: 'email', message: '请输入有效的邮箱' }]}>
              <Input prefix={<MailOutlined />} placeholder="邮箱（选填）" style={{ height: 44 }} />
            </Form.Item>
            <Form.Item name="phone">
              <Input prefix={<PhoneOutlined />} placeholder="手机号（选填）" style={{ height: 44 }} />
            </Form.Item>
            <Form.Item name="companyName">
              <Input prefix={<ShopOutlined />} placeholder="公司/团队名称（选填）" style={{ height: 44 }} />
            </Form.Item>
            <Form.Item style={{ marginTop: 4 }}>
              <Button type="primary" htmlType="submit" block style={{ height: 48, fontSize: 16, fontWeight: 600, borderRadius: 8 }}>
                注 册
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">已有账号？</Text>
              <Link to="/login" style={{ fontWeight: 500 }}>立即登录</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
