import { useState } from 'react';
import { Table, Button, Input, Modal, Form, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/authService';
import type { User } from '@/types/user';

export default function UserPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, keyword],
    queryFn: () => userApi.list({ page, size: 20, keyword: keyword || undefined }),
  });

  const createMut = useMutation({
    mutationFn: (values: Partial<User>) => userApi.create(values),
    onSuccess: (res) => {
      const pwd = res.data?.initialPassword;
      message.success(`创建成功，初始密码: ${pwd}（请妥善保存，仅显示一次）`, 6);
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...values }: any) => userApi.update(id, values),
    onSuccess: () => { message.success('更新成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['users'] }); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => userApi.toggleStatus(id, status),
    onSuccess: () => { message.success('状态已更新'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
  });

  const resetPwdMut = useMutation({
    mutationFn: (id: string) => userApi.resetPassword(id),
    onSuccess: (res) => {
      const pwd = res.data?.newPassword;
      message.success(`密码已重置，新密码: ${pwd}（请妥善保存，仅显示一次）`, 6);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
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
      title: '操作', key: 'action',
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
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input prefix={<SearchOutlined />} placeholder="搜索用户" style={{ width: 240 }}
          onPressEnter={(e: any) => setKeyword(e.target.value)} />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建用户</Button>
      </div>
      <Table columns={columns} dataSource={data?.data?.records || []} rowKey="id" loading={isLoading}
        pagination={{ current: page, total: data?.data?.total || 0, onChange: setPage }} />
      <Modal title={editing ? '编辑用户' : '新建用户'} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()} confirmLoading={createMut.isPending || updateMut.isPending}>
        <Form form={form} layout="vertical" onFinish={(values) => editing ? updateMut.mutate({ id: editing.id, ...values }) : createMut.mutate(values)}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="realName" label="真实姓名"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
