import { useState } from 'react';
import { Modal, List, Button, Select, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionApi, type PermissionRule } from '@/services/roleApi';
import { userApi } from '@/services/authService';
import { roleApi } from '@/services/roleApi';

interface Props {
  open: boolean;
  onClose: () => void;
  targetType: 'doc' | 'space' | 'file' | 'folder';
  targetId: string;
  targetName: string;
}

export default function PermissionModal({ open, onClose, targetType, targetId, targetName }: Props) {
  const [subjectType, setSubjectType] = useState<'user' | 'role'>('user');
  const [subjectId, setSubjectId] = useState('');
  const [action, setAction] = useState<'read' | 'write' | 'delete' | 'admin'>('read');
  const [effect, setEffect] = useState<'allow' | 'deny'>('allow');
  const queryClient = useQueryClient();

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['permission-rules', targetType, targetId],
    queryFn: () => permissionApi.listRules({ targetType, targetId }),
    enabled: open,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => userApi.list({ page: 1, size: 999 }),
    enabled: open && subjectType === 'user',
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: () => roleApi.list({ size: 999 }),
    enabled: open && subjectType === 'role',
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<PermissionRule>) => permissionApi.createRule(data),
    onSuccess: () => {
      message.success('规则已添加');
      queryClient.invalidateQueries({ queryKey: ['permission-rules'] });
      queryClient.invalidateQueries({ queryKey: ['permission'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => permissionApi.deleteRule(id),
    onSuccess: () => {
      message.success('规则已删除');
      queryClient.invalidateQueries({ queryKey: ['permission-rules'] });
      queryClient.invalidateQueries({ queryKey: ['permission'] });
    },
  });

  const rules = rulesData?.data || [];
  const users = usersData?.data?.records || [];
  const roles = rolesData?.data?.records || [];

  const subjectOptions = subjectType === 'user'
    ? users.map((u: any) => ({ label: `${u.realName || u.username} (${u.username})`, value: u.id }))
    : roles.map((r: any) => ({ label: r.name, value: r.id }));

  const getSubjectName = (type: string, id: string) => {
    if (type === 'user') {
      const u = users.find((u: any) => u.id === id);
      return u ? `${u.realName || u.username}` : id;
    }
    const r = roles.find((r: any) => r.id === id);
    return r ? r.name : id;
  };

  const handleAddRule = () => {
    if (!subjectId) { message.warning('请选择主体'); return; }
    createMut.mutate({
      subjectType,
      subjectId,
      targetType,
      targetId,
      action,
      effect,
    });
  };

  return (
    <Modal title={`权限设置 - ${targetName}`} open={open} onCancel={onClose} footer={null} width={600}>
      {/* Existing Rules */}
      <List
        loading={isLoading}
        dataSource={rules}
        locale={{ emptyText: '暂无权限规则' }}
        renderItem={(rule: PermissionRule) => (
          <List.Item
            actions={[
              <Popconfirm key="del" title="确定删除？" onConfirm={() => deleteMut.mutate(rule.id)}>
                <Button type="link" size="small" danger>删除</Button>
              </Popconfirm>,
            ]}
          >
            <Space>
              <Tag>{rule.subjectType === 'user' ? '用户' : '角色'}</Tag>
              <span>{getSubjectName(rule.subjectType, rule.subjectId)}</span>
              <Tag color="blue">{rule.action}</Tag>
              <Tag color={rule.effect === 'allow' ? 'green' : 'red'}>
                {rule.effect === 'allow' ? '允许' : '拒绝'}
              </Tag>
            </Space>
          </List.Item>
        )}
      />

      {/* Add Rule Form */}
      <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 8 }}>
        <Space wrap>
          <Select value={subjectType} onChange={setSubjectType} style={{ width: 80 }}>
            <Select.Option value="user">用户</Select.Option>
            <Select.Option value="role">角色</Select.Option>
          </Select>
          <Select
            value={subjectId}
            onChange={setSubjectId}
            style={{ width: 200 }}
            showSearch
            filterOption={(input, option: any) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={subjectOptions}
            placeholder={subjectType === 'user' ? '搜索用户' : '搜索角色'}
          />
          <Select value={action} onChange={setAction} style={{ width: 100 }}>
            <Select.Option value="read">读取</Select.Option>
            <Select.Option value="write">写入</Select.Option>
            <Select.Option value="delete">删除</Select.Option>
            <Select.Option value="admin">管理</Select.Option>
          </Select>
          <Select value={effect} onChange={setEffect} style={{ width: 90 }}>
            <Select.Option value="allow">允许</Select.Option>
            <Select.Option value="deny">拒绝</Select.Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRule}
            loading={createMut.isPending}>添加</Button>
        </Space>
      </div>
    </Modal>
  );
}
