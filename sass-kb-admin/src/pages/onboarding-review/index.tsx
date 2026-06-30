import { useState } from 'react';
import {
  Table, Button, Tag, Drawer, Descriptions, Modal, Input, message, Space, Tabs, Image,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApi } from '@/services/onboardingApi';
import type { ApplicationVO } from '@/types/onboarding';

const { TextArea } = Input;

export default function OnboardingReviewPage() {
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<string>('pending');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ApplicationVO | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-applications', page, statusTab],
    queryFn: () => onboardingApi.list({
      page, size: 20,
      status: statusTab === 'all' ? undefined : statusTab,
    }),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => onboardingApi.approve(id),
    onSuccess: () => {
      message.success('审核通过，租户和账号已自动创建');
      setDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['onboarding-applications'] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      onboardingApi.reject(id, { reason }),
    onSuccess: () => {
      message.success('已驳回');
      setRejectModalOpen(false);
      setRejectReason('');
      setDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['onboarding-applications'] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  const handleView = (record: ApplicationVO) => {
    setSelected(record);
    setDrawerOpen(true);
  };

  const statusColor: Record<string, string> = {
    pending: 'processing',
    approved: 'success',
    rejected: 'error',
  };
  const statusLabel: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已驳回' },
  ];

  const columns = [
    { title: '公司名称', dataIndex: 'companyName', key: 'companyName', ellipsis: true },
    { title: '信用代码', dataIndex: 'creditCode', key: 'creditCode', width: 200 },
    { title: '申请人', dataIndex: 'realName', key: 'realName', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>,
    },
    {
      title: '提交时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: any, record: ApplicationVO) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>入驻审核</h2>

      <Tabs activeKey={statusTab} onChange={(k) => { setStatusTab(k); setPage(1); }} items={tabItems} />

      <Table
        columns={columns}
        dataSource={data?.data?.records || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.data?.total || 0,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条申请`,
        }}
        locale={{ emptyText: '暂无入驻申请' }}
      />

      <Drawer
        title="申请详情"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={580}
        extra={
          selected?.status === 'pending' && (
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={approveMut.isPending}
                onClick={() => approveMut.mutate(selected!.id)}
              >
                通过
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectModalOpen(true)}
              >
                驳回
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <>
            <Descriptions title="📋 企业信息" column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="公司全称" span={2}>{selected.companyName}</Descriptions.Item>
              <Descriptions.Item label="信用代码" span={2}>{selected.creditCode}</Descriptions.Item>
              <Descriptions.Item label="法人">{selected.legalPerson || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selected.contactPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="公司地址" span={2}>{selected.companyAddress || '-'}</Descriptions.Item>
              <Descriptions.Item label="经营范围" span={2}>{selected.businessScope || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系邮箱">{selected.contactEmail || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColor[selected.status]}>{statusLabel[selected.status]}</Tag>
              </Descriptions.Item>
              {selected.licenseUrl && (
                <Descriptions.Item label="营业执照" span={2}>
                  <Image src={selected.licenseUrl} width={200} alt="营业执照" />
                </Descriptions.Item>
              )}
            </Descriptions>

            <Descriptions title="👤 管理员账号" column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="登录账号">{selected.username}</Descriptions.Item>
              <Descriptions.Item label="真实姓名">{selected.realName}</Descriptions.Item>
              <Descriptions.Item label="个人邮箱">{selected.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="个人手机">{selected.phone || '-'}</Descriptions.Item>
            </Descriptions>

            {selected.reviewComment && (
              <Descriptions title="📝 审核意见" column={1} bordered size="small">
                <Descriptions.Item label="驳回原因">{selected.reviewComment}</Descriptions.Item>
              </Descriptions>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title="驳回申请"
        open={rejectModalOpen}
        onOk={() => {
          if (!rejectReason.trim()) { message.warning('请输入驳回原因'); return; }
          rejectMut.mutate({ id: selected!.id, reason: rejectReason });
        }}
        onCancel={() => { setRejectModalOpen(false); setRejectReason(''); }}
        confirmLoading={rejectMut.isPending}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <TextArea
          rows={4}
          placeholder="请输入驳回原因..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
