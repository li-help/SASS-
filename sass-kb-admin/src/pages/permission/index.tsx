import { useState } from 'react';
import { Table, Select, Tag, Space, Button, message, Popconfirm, Typography, Card, Row, Col, Modal, Form } from 'antd';
import { DeleteOutlined, ReloadOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionApi, roleApi } from '@/services/roleApi';
import { userApi } from '@/services/authService';
import type { PermissionRule } from '@/services/roleApi';
import type { User } from '@/types/user';

const { Title, Text } = Typography;

export default function PermissionPage() {
  const [targetType, setTargetType] = useState<string>('');
  const [subjectType, setSubjectType] = useState<string>('');
  const [effect, setEffect] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PermissionRule | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Load all rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['permission-rules', targetType, subjectType],
    queryFn: () => permissionApi.listRules({
      targetType: targetType || undefined,
      subjectType: subjectType || undefined,
    }),
  });

  // Load users and roles for name resolution
  const { data: usersData } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => userApi.list({ page: 1, size: 999 }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: () => roleApi.list({ size: 999 }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => permissionApi.deleteRule(id),
    onSuccess: () => {
      message.success('已删除');
      queryClient.invalidateQueries({ queryKey: ['permission-rules'] });
    },
    onError: () => message.error('删除失败'),
  });

  const batchDeleteMut = useMutation({
    mutationFn: (ids: string[]) => {
      return Promise.all(ids.map(id => permissionApi.deleteRule(id)));
    },
    onSuccess: () => {
      message.success(`已删除 ${selectedRowKeys.length} 条规则`);
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['permission-rules'] });
    },
    onError: () => message.error('批量删除失败'),
  });

  const createMut = useMutation({
    mutationFn: (values: Partial<PermissionRule>) => permissionApi.createRule(values),
    onSuccess: () => { message.success('规则已创建'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['permission-rules'] }); },
    onError: () => message.error('创建失败'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...values }: Partial<PermissionRule> & { id: string }) => permissionApi.updateRule(id, values),
    onSuccess: () => { message.success('规则已更新'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['permission-rules'] }); },
    onError: () => message.error('更新失败'),
  });

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: PermissionRule) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleFinish = (values: any) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, ...values });
    } else {
      createMut.mutate(values);
    }
  };

  const allRules = rulesData?.data || [];
  const users = usersData?.data?.records || [];
  const roles = rolesData?.data?.records || [];

  // Filter by effect client-side
  const filteredRules = effect
    ? allRules.filter((r: PermissionRule) => r.effect === effect)
    : allRules;

  const getUserName = (id: string) => {
    const u = users.find((u: User) => u.id === id);
    return u ? `${u.realName || u.username}` : id.substring(0, 8);
  };

  const getRoleName = (id: string) => {
    const r = roles.find((r: any) => r.id === id);
    return r ? r.name : id.substring(0, 8);
  };

  const actionColor: Record<string, string> = {
    read: 'blue', write: 'orange', delete: 'red', admin: 'purple', member: 'cyan',
  };

  const columns = [
    {
      title: '主体类型', dataIndex: 'subjectType', key: 'subjectType', width: 90,
      render: (t: string) => <Tag>{t === 'user' ? '用户' : '角色'}</Tag>,
    },
    {
      title: '主体名称', key: 'subjectName', width: 140, ellipsis: true,
      render: (_: any, r: PermissionRule) =>
        r.subjectType === 'user' ? getUserName(r.subjectId) : getRoleName(r.subjectId),
    },
    {
      title: '目标类型', dataIndex: 'targetType', key: 'targetType', width: 80,
      render: (t: string) => <Tag color="geekblue">{t}</Tag>,
    },
    {
      title: '目标ID', dataIndex: 'targetId', key: 'targetId', width: 130, ellipsis: true,
      render: (id: string) => id || <Text type="secondary">全局</Text>,
    },
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 80,
      render: (a: string) => <Tag color={actionColor[a] || 'default'}>{a}</Tag>,
    },
    {
      title: '效果', dataIndex: 'effect', key: 'effect', width: 70,
      render: (e: string) => (
        <Tag color={e === 'allow' ? 'green' : 'red'}>
          {e === 'allow' ? '允许' : '拒绝'}
        </Tag>
      ),
    },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_: any, r: PermissionRule) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="确定删除此规则？" onConfirm={() => deleteMut.mutate(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>权限管理</Title>
          <Text type="secondary">管理系统中的所有权限规则</Text>
        </div>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定删除选中的 ${selectedRowKeys.length} 条规则？`}
              onConfirm={() => batchDeleteMut.mutate(selectedRowKeys)}
            >
              <Button danger loading={batchDeleteMut.isPending}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建规则</Button>
          <Button icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['permission-rules'] })}>
            刷新
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col>
            <Select
              allowClear
              placeholder="目标类型"
              style={{ width: 140 }}
              value={targetType || undefined}
              onChange={(v) => { setTargetType(v || ''); setSelectedRowKeys([]); }}
              options={[
                { label: '全部', value: '' },
                { label: '空间 (space)', value: 'space' },
                { label: '文件夹 (folder)', value: 'folder' },
                { label: '文档 (doc)', value: 'doc' },
                { label: '文件 (file)', value: 'file' },
              ]}
            />
          </Col>
          <Col>
            <Select
              allowClear
              placeholder="主体类型"
              style={{ width: 120 }}
              value={subjectType || undefined}
              onChange={(v) => { setSubjectType(v || ''); setSelectedRowKeys([]); }}
              options={[
                { label: '全部', value: '' },
                { label: '用户', value: 'user' },
                { label: '角色', value: 'role' },
              ]}
            />
          </Col>
          <Col>
            <Select
              allowClear
              placeholder="效果"
              style={{ width: 100 }}
              value={effect || undefined}
              onChange={(v) => setEffect(v || '')}
              options={[
                { label: '全部', value: '' },
                { label: '允许', value: 'allow' },
                { label: '拒绝', value: 'deny' },
              ]}
            />
          </Col>
          <Col>
            <Text type="secondary" style={{ lineHeight: '32px' }}>
              共 {filteredRules.length} 条规则
            </Text>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredRules}
        rowKey="id"
        loading={isLoading}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        scroll={{ x: 800 }}
        size="middle"
        locale={{ emptyText: '暂无权限规则' }}
      />

      {/* Create/Edit Rule Modal */}
      <Modal
        title={editing ? '编辑权限规则' : '新建权限规则'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending || updateMut.isPending}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}
          initialValues={{ effect: 'allow', action: 'read' }}>
          <Form.Item name="subjectType" label="主体类型" rules={[{ required: true, message: '请选择主体类型' }]}>
            <Select
              options={[
                { label: '用户', value: 'user' },
                { label: '角色', value: 'role' },
              ]}
            />
          </Form.Item>
          <Form.Item name="subjectId" label="主体ID" rules={[{ required: true, message: '请输入主体ID' }]}>
            <Select
              showSearch
              placeholder="选择用户或角色"
              filterOption={(input, option) =>
                (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                ...users.map((u: User) => ({ label: `${u.realName || u.username} (用户)`, value: u.id })),
                ...roles.map((r: any) => ({ label: `${r.name} (角色)`, value: r.id })),
              ]}
            />
          </Form.Item>
          <Form.Item name="targetType" label="目标类型" rules={[{ required: true, message: '请选择目标类型' }]}>
            <Select
              options={[
                { label: '空间', value: 'space' },
                { label: '文件夹', value: 'folder' },
                { label: '文档', value: 'doc' },
                { label: '文件', value: 'file' },
              ]}
            />
          </Form.Item>
          <Form.Item name="targetId" label="目标ID（留空表示全局）">
            <Input placeholder="可选，留空表示作用于所有该类型资源" />
          </Form.Item>
          <Form.Item name="action" label="操作" rules={[{ required: true, message: '请选择操作' }]}>
            <Select
              options={[
                { label: '读取 (read)', value: 'read' },
                { label: '写入 (write)', value: 'write' },
                { label: '删除 (delete)', value: 'delete' },
                { label: '管理 (admin)', value: 'admin' },
              ]}
            />
          </Form.Item>
          <Form.Item name="effect" label="效果" rules={[{ required: true, message: '请选择效果' }]}>
            <Select
              options={[
                { label: '允许 (allow)', value: 'allow' },
                { label: '拒绝 (deny)', value: 'deny' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
