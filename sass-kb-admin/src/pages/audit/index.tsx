import { useState } from 'react';
import { Table, Select, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/services/auditApi';

const ACTION_OPTIONS = [
  { label: '全部', value: '' },
  { label: '创建文档', value: 'CREATE_DOC' },
  { label: '更新文档', value: 'UPDATE_DOC' },
  { label: '删除文档', value: 'DELETE_DOC' },
  { label: '创建空间', value: 'CREATE_SPACE' },
  { label: '删除空间', value: 'DELETE_SPACE' },
  { label: '上传文件', value: 'UPLOAD_FILE' },
  { label: '删除文件', value: 'DELETE_FILE' },
];

const ACTION_COLORS: Record<string, string> = {
  CREATE_DOC: 'green',
  UPDATE_DOC: 'blue',
  DELETE_DOC: 'red',
  CREATE_SPACE: 'green',
  DELETE_SPACE: 'red',
  UPLOAD_FILE: 'blue',
  DELETE_FILE: 'red',
};

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: () => auditApi.list({ page, size: 20, action: actionFilter || undefined }),
  });

  const columns = [
    {
      title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (t: string) => t?.substring(0, 19),
    },
    { title: '用户', dataIndex: 'username', key: 'username', width: 120 },
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 120,
      render: (a: string) => <Tag color={ACTION_COLORS[a] || 'default'}>{a}</Tag>,
    },
    { title: '目标类型', dataIndex: 'targetType', key: 'targetType', width: 100 },
    { title: '目标ID', dataIndex: 'targetId', key: 'targetId', width: 140, ellipsis: true },
    { title: 'IP地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 130 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Select
          style={{ width: 160 }}
          value={actionFilter}
          onChange={(v) => { setActionFilter(v); setPage(1); }}
          options={ACTION_OPTIONS}
        />
      </div>
      <Table
        columns={columns}
        dataSource={data?.data?.records || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ current: page, total: data?.data?.total || 0, onChange: setPage }}
        scroll={{ x: 800 }}
      />
    </div>
  );
}
