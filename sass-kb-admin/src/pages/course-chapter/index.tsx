import { useState } from 'react';
import { Table, Button, Input, Modal, Form, Space, message, Popconfirm, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chapterApi, courseApi, type CourseChapter, type Course } from '@/services/courseApi';

export default function CourseChapterPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CourseChapter | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: courseData } = useQuery({
    queryKey: ['courses-all-chapters'],
    queryFn: () => courseApi.list({ page: 1, size: 999 }),
  });

  const { data: chapters, isLoading } = useQuery({
    queryKey: ['chapters', selectedCourseId],
    queryFn: () => chapterApi.listByCourse(selectedCourseId),
    enabled: !!selectedCourseId,
  });

  const createMut = useMutation({
    mutationFn: (v: any) => chapterApi.create(v),
    onSuccess: () => { message.success('创建成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['chapters'] }); },
    onError: () => message.error('创建失败'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...v }: any) => chapterApi.update(id, v),
    onSuccess: () => { message.success('更新成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['chapters'] }); },
    onError: () => message.error('更新失败'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => chapterApi.delete(id),
    onSuccess: () => { message.success('已删除'); queryClient.invalidateQueries({ queryKey: ['chapters'] }); },
    onError: () => message.error('删除失败'),
  });

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldValue('courseId', selectedCourseId); setModalOpen(true); };
  const openEdit = (r: CourseChapter) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };

  const columns = [
    { title: '章节名称', dataIndex: 'chapterName', key: 'chapterName' },
    { title: '描述', dataIndex: 'chapterDesc', key: 'chapterDesc', ellipsis: true },
    { title: '课时数', dataIndex: 'periodCount', key: 'periodCount', width: 80 },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '操作', key: 'action',
      render: (_: any, record: CourseChapter) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="删除章节将同时删除其中所有课时，确定？" onConfirm={() => deleteMut.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const courses = courseData?.data?.records || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Select
          placeholder="请先选择课程"
          style={{ width: 300 }}
          value={selectedCourseId || undefined}
          onChange={(v) => setSelectedCourseId(v || '')}
          allowClear
          options={courses.map((c: Course) => ({ label: c.courseName, value: c.id }))}
          showSearch
          optionFilterProp="label"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!selectedCourseId}>新建章节</Button>
      </div>
      <Table columns={columns} dataSource={chapters?.data || []} rowKey="id" loading={isLoading}
        pagination={false} locale={{ emptyText: selectedCourseId ? '暂无章节' : '请先选择课程' }} />
      <Modal title={editing ? '编辑章节' : '新建章节'} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()} confirmLoading={createMut.isPending || updateMut.isPending}>
        <Form form={form} layout="vertical" onFinish={(v) => editing ? updateMut.mutate({ id: editing.id, ...v }) : createMut.mutate(v)}>
          <Form.Item name="courseId" label="课程ID" hidden><Input /></Form.Item>
          <Form.Item name="chapterName" label="章节名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：第一章" />
          </Form.Item>
          <Form.Item name="chapterDesc" label="章节描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="sort" label="排序"><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
