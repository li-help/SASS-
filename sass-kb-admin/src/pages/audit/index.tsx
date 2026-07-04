import { useState } from 'react';
import { Table, Select, Tag, DatePicker, Space, Button, Modal, Descriptions, Typography, Input, message } from 'antd';
import { DownloadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { auditApi, type AuditLog } from '@/services/auditApi';
import dayjs from 'dayjs';
import { downloadCSV } from '@/utils/csv';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

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

const CSV_HEADERS = ['时间', '用户', '操作', '目标类型', '目标ID', 'IP地址', '详情'];

function exportCSV(data: AuditLog[]) {
  const rows = data.map((r) => [
    r.createdAt?.substring(0, 19) || '',
    r.username || '',
    r.action || '',
    r.targetType || '',
    r.targetId || '',
    r.ipAddress || '',
    r.detail || '',
  ]);
  downloadCSV(CSV_HEADERS, rows, `审计日志_${dayjs().format('YYYY-MM-DD_HHmmss')}.csv`);
  message.success('导出成功');
}

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, dateRange, userIdFilter],
    queryFn: () => auditApi.list({
      page,
      size: 20,
      action: actionFilter || undefined,
      userId: userIdFilter || undefined,
      startDate: dateRange?.[0]?.startOf('day').toISOString(),
      endDate: dateRange?.[1]?.endOf('day').toISOString(),
    }),
  });

  const logs = data?.data?.records || [];

  const handleUserClick = (username: string) => {
    setUserIdFilter(userIdFilter === username ? '' : username);
    setPage(1);
  };

  const handleTargetClick = (targetType: string, targetId: string) => {
    if (targetType === 'doc' && targetId) {
      navigate(`/doc/${targetId}`);
    } else if (targetType === 'space' && targetId) {
      navigate(`/space/${targetId}`);
    }
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 160,
      sorter: (a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      },
      defaultSortOrder: 'descend',
      render: (t: string) => {
        if (!t) return '-';
        return t.substring(0, 19);
      },
    },
    {
      title: '用户', dataIndex: 'username', key: 'username', width: 120,
      render: (name: string) => (
        <a onClick={() => handleUserClick(name)} style={{ cursor: 'pointer' }}>
          {name}
        </a>
      ),
    },
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 120,
      render: (a: string) => <Tag color={ACTION_COLORS[a] || 'default'}>{a}</Tag>,
    },
    {
      title: '目标类型', dataIndex: 'targetType', key: 'targetType', width: 100,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: '目标ID', dataIndex: 'targetId', key: 'targetId', width: 140, ellipsis: true,
      render: (id: string, record: AuditLog) => (
        id ? (
          <a onClick={() => handleTargetClick(record.targetType, id)} style={{ cursor: 'pointer', fontSize: 12 }}>
            {id.length > 15 ? id.substring(0, 12) + '...' : id}
          </a>
        ) : '-'
      ),
    },
    { title: 'IP地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 130 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>审计日志</Title>
          {userIdFilter && (
            <Tag closable onClose={() => { setUserIdFilter(''); setPage(1); }} color="blue" style={{ marginTop: 8 }}>
              筛选用户: {userIdFilter}
            </Tag>
          )}
        </div>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => exportCSV(logs)}
            disabled={logs.length === 0}
          >
            导出CSV
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => {
            setActionFilter('');
            setDateRange(null);
            setUserIdFilter('');
            setPage(1);
          }}>
            重置
          </Button>
        </Space>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
      <RangePicker
        value={dateRange}
        onChange={(dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => { setDateRange(dates); setPage(1); }}
        placeholder={['开始日期', '结束日期']}
        allowClear
      />
        <Select
          style={{ width: 150 }}
          value={actionFilter}
          onChange={(v) => { setActionFilter(v); setPage(1); }}
          options={ACTION_OPTIONS}
          placeholder="操作类型"
        />
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索用户名"
          style={{ width: 180 }}
          value={userIdFilter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const target = e.target as HTMLInputElement;
            setUserIdFilter(target.value);
            setPage(1);
          }}
          allowClear
        />
      </Space>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => ({
          onClick: () => setDetailLog(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          total: data?.data?.total || 0,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
          showSizeChanger: true,
        }}
        scroll={{ x: 800 }}
        locale={{ emptyText: '暂无审计日志' }}
      />

      <Modal
        title="审计日志详情"
        open={!!detailLog}
        onCancel={() => setDetailLog(null)}
        footer={<Button onClick={() => setDetailLog(null)}>关闭</Button>}
        width={600}
      >
        {detailLog && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="时间">{detailLog.createdAt?.substring(0, 19)}</Descriptions.Item>
            <Descriptions.Item label="用户">{detailLog.username}</Descriptions.Item>
            <Descriptions.Item label="操作">
              <Tag color={ACTION_COLORS[detailLog.action] || 'default'}>{detailLog.action}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="目标类型">{detailLog.targetType}</Descriptions.Item>
            <Descriptions.Item label="目标ID" span={2}>{detailLog.targetId || '-'}</Descriptions.Item>
            <Descriptions.Item label="IP地址" span={2}>{detailLog.ipAddress || '-'}</Descriptions.Item>
            <Descriptions.Item label="详情" span={2}>
              <Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {detailLog.detail || '无详情'}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
