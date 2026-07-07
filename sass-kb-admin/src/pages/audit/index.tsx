import { useState } from 'react';
import { Table, Select, Typography, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/services/auditApi';
import type { AuditLog } from '@/services/auditApi';

const { Title } = Typography;

const ACTION_COLORS: Record<string, string> = {
  CREATED: 'green',
  UPDATED: 'blue',
  DELETED: 'red',
};

const TARGET_LABELS: Record<string, string> = {
  FILE: '文件',
  ROLE: '角色',
  USER: '用户',
  TENANT: '租户',
  MENU: '菜单',
  DOC: '文档',
  SPACE: '空间',
};

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [targetType, setTargetType] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, targetType, action],
    queryFn: () => auditApi.list({ page, size: 20, targetType, action }),
  });

  const columns: ColumnsType<AuditLog> = [
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 100,
      render: (v: string) => <Tag color={ACTION_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: '目标类型', dataIndex: 'targetType', key: 'targetType', width: 100,
      render: (v: string) => TARGET_LABELS[v] || v,
    },
    { title: '目标ID', dataIndex: 'targetId', key: 'targetId', width: 120, ellipsis: true },
    {
      title: '操作时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>操作日志</Title>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select
            allowClear
            placeholder="操作类型"
            style={{ width: 120 }}
            value={action}
            onChange={setAction}
            options={[
              { label: '创建', value: 'CREATED' },
              { label: '更新', value: 'UPDATED' },
              { label: '删除', value: 'DELETED' },
            ]}
          />
          <Select
            allowClear
            placeholder="目标类型"
            style={{ width: 120 }}
            value={targetType}
            onChange={setTargetType}
            options={[
              { label: '文件', value: 'FILE' },
              { label: '角色', value: 'ROLE' },
              { label: '用户', value: 'USER' },
              { label: '租户', value: 'TENANT' },
              { label: '菜单', value: 'MENU' },
            ]}
          />
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={data?.data?.records || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.data?.total || 0,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
        locale={{ emptyText: '暂无日志' }}
      />
    </div>
  );
}
