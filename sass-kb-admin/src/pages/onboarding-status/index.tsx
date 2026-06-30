import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Result, Spin, Button, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { onboardingApi } from '@/services/onboardingApi';

const { Text } = Typography;

export default function OnboardingStatusPage() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId') || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['onboarding-status', applicationId],
    queryFn: () => onboardingApi.status(applicationId),
    enabled: !!applicationId,
    refetchInterval: 15_000,
  });

  if (!applicationId) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
        <Result
          status="warning"
          title="缺少申请编号"
          subTitle="请从提交成功页面跳转，或输入申请编号查询"
          extra={<Link to="/login"><Button type="primary">返回登录</Button></Link>}
        />
      </div>
    );
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" tip="查询中..." /></div>;
  }

  if (error || !data?.data) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
        <Result status="error" title="查询失败" subTitle="申请不存在或编号有误" />
      </div>
    );
  }

  const app = data.data;

  const statusConfig: Record<string, { status: 'success' | 'info' | 'error'; title: string; subTitle: string; extra?: React.ReactNode }> = {
    pending: {
      status: 'info',
      title: '审核中',
      subTitle: `您的入驻申请正在审核中，请耐心等待。企业名称：${app.companyName}`,
    },
    approved: {
      status: 'success',
      title: '审核通过',
      subTitle: `恭喜！您的企业「${app.companyName}」已通过审核，现在可以登录使用了。`,
      extra: <Link to="/login"><Button type="primary">去登录</Button></Link>,
    },
    rejected: {
      status: 'error',
      title: '审核驳回',
      subTitle: app.reviewComment || '您的入驻申请未通过审核',
    },
  };

  const config = statusConfig[app.status] || statusConfig.pending;

  return (
    <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
      <Result
        status={config.status}
        title={config.title}
        subTitle={
          <>
            <Text>{config.subTitle}</Text>
            <br />
            <Tag style={{ marginTop: 12 }}>
              {app.status === 'pending' ? '待审核' : app.status === 'approved' ? '已通过' : '已驳回'}
            </Tag>
          </>
        }
        extra={config.extra}
      />
    </div>
  );
}
