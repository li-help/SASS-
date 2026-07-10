import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Tag, Space, message, Popconfirm, Select } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi, categoryApi, teacherApi, type Course } from '@/services/courseApi';

const DIFFICULTY_MAP: Record<number, { color: string; text: string }> = {
  1: { color: 'green', text: '入门' },
  2: { color: 'orange', text: '进阶' },
  3: { color: 'red', text: '高级' },
};
const STATUS_MAP: Record<number, { color: string; text: string }> = {
  0: { color: 'default', text: '草稿' },
  1: { color: 'green', text: '上架' },
  2: { color: 'red', text: '下架' },
};

export default function CoursePage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => { setKeyword(searchText); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page, keyword, statusFilter],
    queryFn: () => courseApi.list({ page, size: 20, courseName: keyword || undefined, status: statusFilter }),
  });

  const { data: categoryTree } = useQuery({ queryKey: ['categories-tree'], queryFn: () => categoryApi.tree() });
  const { data: teacherData } = useQuery({ queryKey: ['teachers-all'], queryFn: () => teacherApi.all() });

  const createMut = useMutation({
    mutationFn: (v: any) => courseApi.create(v),
    onSuccess: () => { message.success('创建成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['courses'] }); },
    onError: () => message.error('创建失败'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...v }: any) => courseApi.update(id, v),
    onSuccess: () => { message.success('更新成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['courses'] }); },
    onError: () => message.error('更新失败'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => courseApi.delete(id),
    onSuccess: () => { message.success('已删除'); queryClient.invalidateQueries({ queryKey: ['courses'] }); },
    onError: () => message.error('删除失败'),
  });

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r: Course) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };

  // flatten category tree for Select
  const flattenCats = (nodes?: any[], prefix = ''): { label: string; value: string }[] => {
    if (!nodes) return [];
    return nodes.flatMap((n: any) => [
      { label: prefix + n.catName, value: n.id },
      ...flattenCats(n.children, prefix + '— '),
    ]);
  };

  const teachers = teacherData?.data?.records || [];
  const categories = flattenCats(categoryTree?.data);

  const columns = [
    { title: '课程名称', dataIndex: 'courseName', key: 'courseName' },
    { title: '分类', dataIndex: 'categoryName', key: 'categoryName' },
    { title: '讲师', dataIndex: 'teacherName', key: 'teacherName' },
    {
      title: '难度', dataIndex: 'difficulty', key: 'difficulty',
      render: (d: number) => <Tag color={DIFFICULTY_MAP[d]?.color}>{DIFFICULTY_MAP[d]?.text}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: number) => <Tag color={STATUS_MAP[s]?.color}>{STATUS_MAP[s]?.text}</Tag>,
    },
    { title: '学习人数', dataIndex: 'studentCount', key: 'studentCount', width: 80 },
    { title: '现价(元)', dataIndex: 'currentPrice', key: 'currentPrice', width: 80 },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Course) => (
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
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="搜索课程" style={{ width: 260 }}
            value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear />
          <Select allowClear placeholder="状态" style={{ width: 100 }}
            value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[{ label: '草稿', value: 0 }, { label: '上架', value: 1 }, { label: '下架', value: 2 }]} />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建课程</Button>
      </div>
      <Table columns={columns} dataSource={data?.data?.records || []} rowKey="id" loading={isLoading}
        pagination={{ current: page, total: data?.data?.total || 0, onChange: setPage, showTotal: (t) => `共 ${t} 门课程` }} />
      <Modal title={editing ? '编辑课程' : '新建课程'} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()} confirmLoading={createMut.isPending || updateMut.isPending} width={640}>
        <Form form={form} layout="vertical" onFinish={(v) => editing ? updateMut.mutate({ id: editing.id, ...v }) : createMut.mutate(v)}>
          <Form.Item name="courseName" label="课程名称" rules={[{ required: true }]}>
            <Input placeholder="课程名称" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="categoryId" label="分类" style={{ width: 260 }}>
              <Select placeholder="选择分类" options={categories} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="teacherId" label="讲师" style={{ width: 260 }}>
              <Select placeholder="选择讲师"
                options={teachers.map((t: any) => ({ label: t.teacherName, value: t.id }))}
                showSearch optionFilterProp="label" />
            </Form.Item>
          </Space>
          <Form.Item name="cover" label="封面URL"><Input placeholder="封面图片链接" /></Form.Item>
          <Form.Item name="introduce" label="课程介绍"><Input.TextArea rows={3} /></Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="originalPrice" label="原价(分)"><Input type="number" placeholder="单位：分" /></Form.Item>
            <Form.Item name="currentPrice" label="现价(分)"><Input type="number" placeholder="单位：分" /></Form.Item>
            <Form.Item name="difficulty" label="难度" initialValue={1}>
              <Select options={[{ label: '入门', value: 1 }, { label: '进阶', value: 2 }, { label: '高级', value: 3 }]} />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="sort" label="排序"><Input type="number" /></Form.Item>
            <Form.Item name="status" label="状态" initialValue={0}>
              <Select options={[{ label: '草稿', value: 0 }, { label: '上架', value: 1 }, { label: '下架', value: 2 }]} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
