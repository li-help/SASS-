import { useState } from 'react';
import { Table, Button, Input, Modal, Form, Tag, Space, message, Popconfirm, Checkbox, Transfer, Select } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '@/services/roleApi';
import { userApi } from '@/services/authService';
import type { Role } from '@/services/roleApi';

const PERMISSION_OPTIONS = [
  { label: '空间-读取', value: 'space:read' },
  { label: '空间-写入', value: 'space:write' },
  { label: '空间-管理', value: 'space:admin' },
  { label: '文档-读取', value: 'doc:read' },
  { label: '文档-写入', value: 'doc:write' },
  { label: '文档-删除', value: 'doc:delete' },
  { label: '文档-管理', value: 'doc:admin' },
  { label: '文件-读取', value: 'file:read' },
  { label: '文件-写入', value: 'file:write' },
  { label: '文件-删除', value: 'file:delete' },
];

export default function RolePage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [assigningRole, setAssigningRole] = useState<Role | null>(null);
  const [selectedUserKeys, setSelectedUserKeys] = useState<string[]>([]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['roles', page, keyword],
    queryFn: () => roleApi.list({ page, size: 20, keyword: keyword || undefined }),
  });

  const { data: allUsers } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => userApi.list({ page: 1, size: 999 }),
  });

  const { data: members } = useQuery({
    queryKey: ['role-members', assigningRole?.id],
    queryFn: () => roleApi.getMembers(assigningRole!.id),
    enabled: !!assigningRole?.id,
  });

  const createMut = useMutation({
    mutationFn: (values: Partial<Role>) => roleApi.create(values),
    onSuccess: () => { message.success('创建成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['roles'] }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...values }: Partial<Role> & { id: string }) => roleApi.update(id, values),
    onSuccess: () => { message.success('更新成功'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['roles'] }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => roleApi.delete(id),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['roles'] }); },
  });

  const assignMut = useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) => roleApi.assignUsers(id, userIds),
    onSuccess: () => {
      message.success('分配成功');
      setAssignOpen(false);
      queryClient.invalidateQueries({ queryKey: ['role-members'] });
      queryClient.invalidateQueries({ queryKey: ['permission'] });
    },
  });

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: Role) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name, description: record.description, permissions: record.permissions || [] });
    setModalOpen(true);
  };
  const openAssign = (record: Role) => {
    setAssigningRole(record);
    setSelectedUserKeys([]);
    setAssignOpen(true);
  };

  const initDefaultsMut = useMutation({
    mutationFn: () => roleApi.initDefaults(),
    onSuccess: (res: any) => {
      message.success(`已创建 ${res.data?.length || 0} 个默认角色`);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: () => message.error('初始化失败'),
  });

  const handleFinish = (values: any) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, ...values });
    } else {
      createMut.mutate(values);
    }
  };

  const getParentRoleName = (parentId?: string) => {
    if (!parentId) return null;
    const roles = data?.data?.records || [];
    const parent = roles.find((r: Role) => r.id === parentId);
    return parent ? parent.name : null;
  };

  // Compute Transfer data
  const allUserData = (allUsers?.data?.records || []).map((u: any) => ({
    key: u.id,
    title: `${u.realName || u.username} (${u.username})`,
  }));
  const memberKeys = (members?.data || []).map((u: any) => u.id);

  // Update Transfer target keys when members load
  const effectiveTargetKeys = selectedUserKeys.length > 0 ? selectedUserKeys : memberKeys;

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '权限', dataIndex: 'permissions', key: 'permissions',
      render: (perms: string[]) => (
        <Space size={4} wrap>
          {perms?.map(p => <Tag key={p} color="blue">{p}</Tag>)}
        </Space>
      ),
    },
    {
      title: '父角色', dataIndex: 'parentId', key: 'parentId', width: 100,
      render: (pid: string) => getParentRoleName(pid) ? <Tag>{getParentRoleName(pid)}</Tag> : '-',
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (t: string) => t?.substring(0, 10) },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Role) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" onClick={() => openAssign(record)}>分配用户</Button>
          <Popconfirm title="确定删除？" onConfirm={() => deleteMut.mutate(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input prefix={<SearchOutlined />} placeholder="搜索角色" style={{ width: 240 }}
          onPressEnter={(e: any) => setKeyword(e.target.value)} />
        <Space>
          {(data?.data?.records || []).length === 0 && !isLoading && (
            <Button onClick={() => initDefaultsMut.mutate()} loading={initDefaultsMut.isPending}>
              初始化默认角色
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建角色</Button>
        </Space>
      </div>
      <Table columns={columns} dataSource={data?.data?.records || []} rowKey="id" loading={isLoading}
        pagination={{ current: page, total: data?.data?.total || 0, onChange: setPage }} />

      {/* Create/Edit Modal */}
      <Modal title={editing ? '编辑角色' : '新建角色'} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()} confirmLoading={createMut.isPending || updateMut.isPending} width={640}>
        <Form form={form} layout="vertical" onFinish={handleFinish}
          initialValues={{ permissions: [] }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="permissions" label="权限">
            <Checkbox.Group options={PERMISSION_OPTIONS} />
          </Form.Item>
          <Form.Item name="parentId" label="父角色（继承权限）">
            <Select
              allowClear
              placeholder="选择父角色（可选）"
              options={(data?.data?.records || [])
                .filter((r: Role) => r.id !== editing?.id)
                .map((r: Role) => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Users Modal */}
      <Modal title={`分配用户 - ${assigningRole?.name || ''}`} open={assignOpen}
        onCancel={() => setAssignOpen(false)} onOk={() => {
          assignMut.mutate({ id: assigningRole!.id, userIds: effectiveTargetKeys });
        }} confirmLoading={assignMut.isPending} width={640}>
        <Transfer
          dataSource={allUserData}
          targetKeys={effectiveTargetKeys}
          onChange={(targetKeys) => setSelectedUserKeys(targetKeys as string[])}
          render={(item: any) => item.title}
          listStyle={{ width: 280, height: 400 }}
          showSearch
          filterOption={(inputValue: string, item: any) =>
            item.title.toLowerCase().includes(inputValue.toLowerCase())
          }
        />
      </Modal>
    </div>
  );
}
