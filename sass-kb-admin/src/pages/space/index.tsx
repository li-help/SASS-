import { useState, useMemo } from 'react';
import { Typography, Button, Card, List, Modal, Form, Input, message, Tag, Spin, Select } from 'antd';
import { PlusOutlined, FolderOpenOutlined, EditOutlined, DeleteOutlined, SafetyOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { spaceApi } from '@/services/docService';
import type { Space } from '@/services/docService';
import PermissionModal from '@/components/permission/PermissionModal';

const { Title, Text, Paragraph } = Typography;

export default function SpacePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Space | null>(null);
  const [permTarget, setPermTarget] = useState<{ type: 'space'; id: string; name: string } | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => spaceApi.list(),
  });

  const createMut = useMutation({
    mutationFn: (values: Partial<Space>) => spaceApi.create(values),
    onSuccess: () => { message.success('空间已创建'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['spaces'] }); },
    onError: () => message.error('创建失败'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...values }: any) => spaceApi.update(id, values),
    onSuccess: () => { message.success('空间已更新'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['spaces'] }); },
    onError: () => message.error('更新失败'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => spaceApi.delete(id),
    onSuccess: () => { message.success('空间已删除'); queryClient.invalidateQueries({ queryKey: ['spaces'] }); },
    onError: () => message.error('删除失败'),
  });

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: Space) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const spaces = data?.data || [];

  const filteredSpaces = useMemo(() => {
    if (!searchText.trim()) return spaces;
    const kw = searchText.toLowerCase();
    return spaces.filter((s: Space) =>
      s.name.toLowerCase().includes(kw) ||
      (s.description || '').toLowerCase().includes(kw)
    );
  }, [spaces, searchText]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>知识空间</Title>
          <Text type="secondary">管理您的知识库空间</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建空间</Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索空间名称或描述"
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      {isLoading ? (
        <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />
      ) : (
        <List
          grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
          dataSource={filteredSpaces}
          renderItem={(space: Space) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => navigate(`/space/${space.id}`)}
                actions={[
                  <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); openEdit(space); }} />,
                  <SafetyOutlined key="perm" onClick={(e) => {
                    e.stopPropagation();
                    setPermTarget({ type: 'space', id: space.id, name: space.name });
                  }} />,
                  <DeleteOutlined key="delete" onClick={(e) => {
                    e.stopPropagation();
                    Modal.confirm({
                      title: '确认删除',
                      content: `确定要删除空间「${space.name}」吗？`,
                      okType: 'danger',
                      onOk: () => deleteMut.mutate(space.id),
                    });
                  }} />,
                ]}
              >
                <Card.Meta
                  avatar={<FolderOpenOutlined style={{ fontSize: 32, color: '#1677ff' }} />}
                  title={space.name}
                  description={
                    <>
                      <Paragraph ellipsis={{ rows: 2 }} type="secondary">{space.description || '暂无描述'}</Paragraph>
                      <Tag color={space.type === 'public' ? 'green' : 'blue'}>{space.type === 'public' ? '公开' : '私有'}</Tag>
                    </>
                  }
                />
              </Card>
            </List.Item>
          )}
          locale={{ emptyText: '暂无空间，点击右上角创建' }}
        />
      )}

      <Modal
        title={editing ? '编辑空间' : '新建空间'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending || updateMut.isPending}
        okText={editing ? '保存' : '创建'}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => editing ? updateMut.mutate({ id: editing.id, ...values }) : createMut.mutate(values)}
        >
          <Form.Item name="name" label="空间名称" rules={[{ required: true, message: '请输入空间名称' }]}>
            <Input placeholder="例如：技术文档库" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="空间的简介" />
          </Form.Item>
          <Form.Item name="type" label="类型" initialValue="public">
            <Select
              options={[
                { label: '公开', value: 'public' },
                { label: '私有', value: 'private' },
              ]}
            />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="Ant Design 图标名称，如 FolderOpenOutlined" />
          </Form.Item>
        </Form>
      </Modal>

      {permTarget && (
        <PermissionModal
          open={!!permTarget}
          onClose={() => setPermTarget(null)}
          targetType={permTarget.type}
          targetId={permTarget.id}
          targetName={permTarget.name}
        />
      )}
    </div>
  );
}
