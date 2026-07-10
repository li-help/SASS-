import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherApi, type Teacher } from '@/services/courseApi';

const STATUS_MAP: Record<number, { color: string; text: string }> = {
  0: { color: 'default', text: '禁用' },
  1: { color: 'green', text: '启用' },
};

export default function TeacherPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => { setKeyword(searchText); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', page, keyword],
    queryFn: () => teacherApi.list({ page, size: 20, keyword: keyword || undefined }),
  });

  const createMut = useMutation({
    mutationFn: (values: Partial<Teacher>) => teacherApi.create(values),
    onSuccess: () => { message.success('创建成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['teachers'] }); },
    onError: () => message.error('创建失败'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...values }: any) => teacherApi.update(id, values),
    onSuccess: () => { message.success('更新成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['teachers'] }); },
    onError: () => message.error('更新失败'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => teacherApi.delete(id),
    onSuccess: () => { message.success('已删除'); queryClient.invalidateQueries({ queryKey: ['teachers'] }); },
    onError: () => message.error('删除失败'),
  });

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r: Teacher) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };

  const columns = [
    { title: '讲师姓名', dataIndex: 'teacherName', key: 'teacherName' },
    { title: '职称', dataIndex: 'title', key: 'title' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: number) => <Tag color={STATUS_MAP[s]?.color}>{STATUS_MAP[s]?.text}</Tag>,
    },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Teacher) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => deleteMut.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索讲师"
          style={{ width: 260 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建讲师</Button>
      </div>
      <Table columns={columns} dataSource={data?.data?.records || []} rowKey="id" loading={isLoading}
        pagination={{ current: page, total: data?.data?.total || 0, onChange: setPage, showTotal: (t) => `共 ${t} 位讲师` }} />
      <Modal title={editing ? '编辑讲师' : '新建讲师'} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()} confirmLoading={createMut.isPending || updateMut.isPending}>
        <Form form={form} layout="vertical" onFinish={(v) => editing ? updateMut.mutate({ id: editing.id, ...v }) : createMut.mutate(v)}>
          <Form.Item name="teacherName" label="讲师姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入讲师姓名" />
          </Form.Item>
          <Form.Item name="title" label="职称"><Input placeholder="如：高级讲师" /></Form.Item>
          <Form.Item name="avatar" label="头像URL"><Input placeholder="头像链接" /></Form.Item>
          <Form.Item name="intro" label="简介"><Input.TextArea rows={3} placeholder="讲师简介" /></Form.Item>
          <Form.Item name="sort" label="排序"><Input type="number" placeholder="数字越小越靠前" /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Input type="number" min={0} max={1} placeholder="0禁用 1启用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
