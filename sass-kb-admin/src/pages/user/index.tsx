import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Tag, Space, message, Popconfirm, Select } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/authService';
import type { User } from '@/types/user';

export default function UserPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
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
    queryKey: ['users', page, keyword, statusFilter],
    queryFn: () => userApi.list({ page, size: 20, keyword: keyword || undefined, status: statusFilter || undefined }),
  });

  const createMut = useMutation({
    mutationFn: (values: Partial<User>) => userApi.create(values),
    onSuccess: (res) => {
      const pwd = res.data?.initialPassword;
      message.success(`创建成功，初始密码: ${pwd}（请妥善保存，仅显示一次）`, 6);
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => message.error('创建失败'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...values }: any) => userApi.update(id, values),
    onSuccess: () => { message.success('更新成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => message.error('更新失败'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => { message.success('已删除'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => message.error('删除失败'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => userApi.toggleStatus(id, status),
    onSuccess: () => { message.success('状态已更新'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => message.error('状态更新失败'),
  });

  const resetPwdMut = useMutation({
    mutationFn: (id: string) => userApi.resetPassword(id),
    onSuccess: (res) => {
      const pwd = res.data?.newPassword;
      message.success(`密码已重置，新密码: ${pwd}（请妥善保存，仅显示一次）`, 6);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => message.error('重置密码失败'),
  });

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: User) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '真实姓名', dataIndex: 'realName', key: 'realName' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 220,
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger={record.status === 'active'}
            onClick={() => toggleMut.mutate({ id: record.id, status: record.status === 'active' ? 'disabled' : 'active' })}>
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Popconfirm title="确定重置密码？" onConfirm={() => resetPwdMut.mutate(record.id)}>
            <Button type="link" size="small">重置密码</Button>
          </Popconfirm>
          <Popconfirm title="确定删除此用户？" onConfirm={() => deleteMut.mutate(record.id)}>
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
            placeholder="搜索用户（输入自动搜索）"
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
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建用户</Button>
      </div>
      <Table
        columns={columns}
        dataSource={data?.data?.records || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ current: page, total: data?.data?.total || 0, onChange: setPage, showTotal: (t) => `共 ${t} 个用户` }}
        locale={{ emptyText: '暂无用户' }}
      />
      <Modal
        title={editing ? '编辑用户' : '新建用户'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending || updateMut.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(values) => editing ? updateMut.mutate({ id: editing.id, ...values }) : createMut.mutate(values)}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={!!editing} placeholder={editing ? '' : '请输入用户名'} />
          </Form.Item>
          <Form.Item name="realName" label="真实姓名">
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ pattern: /^[\d\-+() ]{7,20}$/, message: '请输入有效的手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
