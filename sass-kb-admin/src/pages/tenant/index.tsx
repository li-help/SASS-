import { useState } from 'react';
import { Table, Button, Input, Modal, Form, Tag, Space, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/services/authService';
import type { Tenant } from '@/types/user';

export default function TenantPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', page, keyword],
    queryFn: () => tenantApi.list({ page, size: 20, keyword: keyword || undefined }),
  });

  const createMut = useMutation({
    mutationFn: (values: Partial<Tenant>) => tenantApi.create(values),
    onSuccess: () => { message.success('创建成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...values }: any) => tenantApi.update(id, values),
    onSuccess: () => { message.success('更新成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tenantApi.toggleStatus(id, status),
    onSuccess: () => { message.success('状态已更新'); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
  });

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: Tenant) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const columns = [
    { title: '租户名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contactName', key: 'contactName' },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone' },
    { title: '最大用户数', dataIndex: 'maxUserCount', key: 'maxUserCount' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Tenant) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger={record.status === 'active'}
            onClick={() => toggleMut.mutate({ id: record.id, status: record.status === 'active' ? 'disabled' : 'active' })}>
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input prefix={<SearchOutlined />} placeholder="搜索租户" style={{ width: 240 }}
          onPressEnter={(e: any) => setKeyword(e.target.value)} />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建租户</Button>
      </div>
      <Table columns={columns} dataSource={data?.data?.records || []} rowKey="id" loading={isLoading}
        pagination={{ current: page, total: data?.data?.total || 0, onChange: setPage }} />
      <Modal title={editing ? '编辑租户' : '新建租户'} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()} confirmLoading={createMut.isPending || updateMut.isPending}>
        <Form form={form} layout="vertical" onFinish={(values) => editing ? updateMut.mutate({ id: editing.id, ...values }) : createMut.mutate(values)}>
          <Form.Item name="name" label="租户名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contactName" label="联系人"><Input /></Form.Item>
          <Form.Item name="contactPhone" label="联系电话"><Input /></Form.Item>
          <Form.Item name="maxUserCount" label="最大用户数"><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
