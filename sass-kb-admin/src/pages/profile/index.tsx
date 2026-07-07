import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { userApi } from '@/services/authService';

const { Title } = Typography;

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => userApi.me(),
  });

  const updateMut = useMutation({
    mutationFn: (values: Record<string, string>) => userApi.updateMe(values),
    onSuccess: () => message.success('个人信息已更新'),
    onError: () => message.error('更新失败'),
  });

  const updatePwdMut = useMutation({
    mutationFn: (values: Record<string, string>) => userApi.updateMe(values),
    onSuccess: () => { message.success('密码已修改'); pwdForm.resetFields(); },
    onError: () => message.error('修改失败'),
  });

  const handleUpdate = (values: Record<string, string>) => {
    updateMut.mutate(values);
  };

  const handlePwdUpdate = (values: Record<string, string>) => {
    updatePwdMut.mutate(values);
  };

  const user = userData?.data;

  return (
    <div style={{ maxWidth: 600 }}>
      <Title level={3} style={{ marginBottom: 24 }}>个人中心</Title>

      <Card title="基本信息" loading={isLoading} style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
          initialValues={{
            realName: user?.realName,
            email: user?.email,
            phone: user?.phone,
          }}
          key={user?.id} // 重新挂载以刷新初始值
        >
          <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} placeholder="姓名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input prefix={<PhoneOutlined />} placeholder="手机号" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateMut.isPending}>保存</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="修改密码">
        <Form form={pwdForm} layout="vertical" onFinish={handlePwdUpdate}>
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="旧密码" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updatePwdMut.isPending}>修改密码</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
