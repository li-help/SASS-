import { useState } from 'react';
import { Table, Button, Input, Modal, Form, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi, type CourseCategory } from '@/services/courseApi';

export default function CourseCategoryPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CourseCategory | null>(null);
  const [parentId, setParentId] = useState<string | undefined>();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: treeData, isLoading } = useQuery({
    queryKey: ['courseCategories'],
    queryFn: () => categoryApi.tree(),
  });

  const createMut = useMutation({
    mutationFn: (v: any) => categoryApi.create(v),
    onSuccess: () => { message.success('创建成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['courseCategories'] }); },
    onError: () => message.error('创建失败'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...v }: any) => categoryApi.update(id, v),
    onSuccess: () => { message.success('更新成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['courseCategories'] }); },
    onError: () => message.error('更新失败'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => { message.success('已删除'); queryClient.invalidateQueries({ queryKey: ['courseCategories'] }); },
    onError: () => message.error('删除失败'),
  });

  const openCreate = (pid?: string) => { setEditing(null); setParentId(pid); form.resetFields(); setModalOpen(true); };
  const openEdit = (r: CourseCategory) => { setEditing(r); setParentId(undefined); form.setFieldsValue(r); setModalOpen(true); };

  // flatten tree to list for table display
  const flatten = (nodes?: CourseCategory[], depth = 0): (CourseCategory & { depth: number })[] => {
    if (!nodes) return [];
    return nodes.flatMap((n) => [{ ...n, depth }, ...flatten(n.children, depth + 1)]);
  };

  const columns = [
    {
      title: '分类名称', dataIndex: 'catName', key: 'catName',
      render: (text: string, record: CourseCategory & { depth: number }) => (
        <span style={{ paddingLeft: record.depth * 24 }}>{text}</span>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: number) => <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '启用' : '禁用'}</Tag>,
    },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '操作', key: 'action',
      render: (_: any, record: CourseCategory & { depth: number }) => (
        <Space>
          <Button type="link" size="small" onClick={() => openCreate(record.id)}>添加子分类</Button>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="删除将同时删除子分类，确定？" onConfirm={() => deleteMut.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>新建根分类</Button>
      </div>
      <Table columns={columns} dataSource={flatten(treeData?.data)} rowKey="id" loading={isLoading}
        pagination={false} locale={{ emptyText: '暂无分类' }} />
      <Modal title={editing ? '编辑分类' : '新建分类'} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()} confirmLoading={createMut.isPending || updateMut.isPending}>
        <Form form={form} layout="vertical" onFinish={(v) => {
          if (editing) updateMut.mutate({ id: editing.id, ...v });
          else createMut.mutate({ ...v, parentId });
        }}>
          <Form.Item name="catName" label="分类名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="sort" label="排序"><Input type="number" placeholder="数字越小越靠前" /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Input type="number" min={0} max={1} placeholder="0禁用 1启用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
