import { useState } from 'react';
import { Button, Form, Input, Steps, Upload, message, Result, Typography } from 'antd';
import {
  UploadOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { onboardingApi } from '@/services/onboardingApi';
import { fileApi } from '@/services/fileService';
import type { ApplyRequest } from '@/types/onboarding';

const { TextArea } = Input;
const { Title, Text } = Typography;

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const applyMut = useMutation({
    mutationFn: (data: ApplyRequest) => onboardingApi.apply(data),
    onSuccess: (res) => {
      setApplicationId(res.data);
      setCurrent(2);
    },
    onError: (err: Error) => message.error(err.message || '提交失败'),
  });

  const handleNext = async () => {
    try {
      await form.validateFields();
      if (current === 1) {
        const values = form.getFieldsValue();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword, ...payload } = values;
        applyMut.mutate(payload);
      } else {
        setCurrent(1);
      }
    } catch {
      // validation errors shown by Form
    }
  };

  const handleUpload = async (file: File): Promise<string> => {
    const res = await fileApi.upload(file);
    return res.data?.storePath || '';
  };

  const steps = [
    { title: '企业信息' },
    { title: '管理员账号' },
    { title: '提交成功' },
  ];

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 16px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
        🏢 商家入驻
      </Title>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
        填写企业和管理员信息，提交后等待审核
      </Text>

      <Steps current={current} items={steps} style={{ marginBottom: 40 }} />

      {current === 0 && (
        <Form form={form} layout="vertical" initialValues={{}}>
          <Form.Item name="companyName" label="公司全称" rules={[{ required: true, message: '请输入公司全称' }]}>
            <Input placeholder="营业执照上的公司全称" />
          </Form.Item>
          <Form.Item
            name="creditCode"
            label="统一社会信用代码"
            rules={[
              { required: true, message: '请输入统一社会信用代码' },
              { len: 18, message: '统一社会信用代码为 18 位' },
            ]}
          >
            <Input placeholder="18 位统一社会信用代码" maxLength={18} />
          </Form.Item>
          <Form.Item name="licenseUrl" label="营业执照">
            <Upload
              maxCount={1}
              beforeUpload={async (file) => {
                const url = await handleUpload(file);
                form.setFieldValue('licenseUrl', url);
                return false;
              }}
              onRemove={() => form.setFieldValue('licenseUrl', undefined)}
            >
              <Button icon={<UploadOutlined />}>上传营业执照</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="legalPerson" label="法人姓名">
            <Input placeholder="法人代表姓名" />
          </Form.Item>
          <Form.Item name="companyAddress" label="公司地址">
            <Input placeholder="公司注册地址" />
          </Form.Item>
          <Form.Item name="businessScope" label="经营范围">
            <TextArea rows={3} placeholder="营业执照上的经营范围" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input placeholder="企业联系电话" />
          </Form.Item>
          <Form.Item name="contactEmail" label="联系邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="企业联系邮箱" />
          </Form.Item>
        </Form>
      )}

      {current === 1 && (
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="登录账号" rules={[
            { required: true, message: '请输入登录账号' },
            { min: 3, max: 50, message: '账号长度 3-50 位' },
          ]}>
            <Input placeholder="用于登录平台的账号" />
          </Form.Item>
          <Form.Item name="password" label="登录密码" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, max: 100, message: '密码长度 6-100 位' },
          ]}>
            <Input.Password placeholder="至少 6 位密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_: unknown, value: string) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="再次输入密码" />
          </Form.Item>
          <Form.Item name="realName" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input placeholder="您的真实姓名" />
          </Form.Item>
          <Form.Item name="email" label="个人邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="联系用邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="个人手机">
            <Input placeholder="联系用手机号" />
          </Form.Item>
        </Form>
      )}

      {current === 2 && (
        <Result
          status="success"
          title="申请已提交"
          subTitle="我们会在 1-3 个工作日内完成审核，审核结果将通知到您的邮箱。"
          extra={[
            <Button type="primary" key="status" onClick={() => navigate(`/onboarding-status?applicationId=${applicationId}`)}>
              查看进度
            </Button>,
            <Button key="home" onClick={() => navigate('/login')}>
              返回登录
            </Button>,
          ]}
        />
      )}

      {current < 2 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button
            disabled={current === 0}
            onClick={() => setCurrent(current - 1)}
            icon={<ArrowLeftOutlined />}
          >
            上一步
          </Button>
          <Button type="primary" onClick={handleNext} loading={applyMut.isPending} icon={<ArrowRightOutlined />}>
            {current === 1 ? '提交审核' : '下一步'}
          </Button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Text type="secondary">已有账号？</Text>{' '}
        <Link to="/login">去登录</Link>
      </div>
    </div>
  );
}
