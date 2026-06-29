import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Tag, Space, message, Popconfirm, Select } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/services/authService';
import type { Tenant } from '@/types/user';

export default function TenantPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchText);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', page, keyword, statusFilter],
    queryFn: () => tenantApi.list({ page, size: 20, keyword: keyword || undefined, status: statusFilter || undefined }),
  });

  const createMut = useMutation({
    mutationFn: (values: Partial<Tenant>) => tenantApi.create(values),
    onSuccess: () => { message.success('创建成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
    onError: () => message.error('创建失败'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...values }: any) => tenantApi.update(id, values),
    onSuccess: () => { message.success('更新成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
    onError: () => message.error('更新失败'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => tenantApi.delete(id),
    onSuccess: () => { message.success('已删除'); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
    onError: () => message.error('删除失败'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tenantApi.toggleStatus(id, status),
    onSuccess: () => { message.success('状态已更新'); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
    onError: () => message.error('状态更新失败'),
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
          <Popconfirm title="确定删除此租户？" onConfirm={() => deleteMut.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索租户（输入自动搜索）"
            style={{ width: 260 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            allowClear
            placeholder="状态筛选"
            style={{ width: 110 }}
            value={statusFilter || undefined}
            onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
            options={[
              { label: '启用', value: 'active' },
              { label: '禁用', value: 'disabled' },
            ]}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建租户</Button>
      </div>
      <Table
        columns={columns}
        dataSource={data?.data?.records || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ current: page, total: data?.data?.total || 0, onChange: setPage, showTotal: (t) => `共 ${t} 个租户` }}
        locale={{ emptyText: '暂无租户' }}
      />
      <Modal
        title={editing ? '编辑租户' : '新建租户'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending || updateMut.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(values) => editing ? updateMut.mutate({ id: editing.id, ...values }) : createMut.mutate(values)}>
          <Form.Item name="name" label="租户名称" rules={[{ required: true, message: '请输入租户名称' }]}>
            <Input placeholder="请输入租户名称" />
          </Form.Item>
          <Form.Item name="contactName" label="联系人">
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="maxUserCount" label="最大用户数">
            <Input type="number" placeholder="请输入最大用户数" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
