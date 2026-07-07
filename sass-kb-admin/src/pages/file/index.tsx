import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Button, Table, Upload, message, Input,
  Space, Tag, Popconfirm,
} from 'antd';
import {
  UploadOutlined, DownloadOutlined, DeleteOutlined,
  SearchOutlined, FileOutlined, SafetyOutlined, EyeOutlined, InboxOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileApi } from '@/services/fileService';
import type { FileAsset } from '@/services/fileService';
import PermissionModal from '@/components/permission/PermissionModal';

const { Title } = Typography;
const { Dragger } = Upload;

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FilePage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [permTarget, setPermTarget] = useState<{ type: 'file'; id: string; name: string } | null>(null);
  const queryClient = useQueryClient();

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchText);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, isLoading } = useQuery({
    queryKey: ['files', page, keyword],
    queryFn: () => fileApi.list({ page, size: 20, keyword: keyword || undefined }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => fileApi.delete(id),
    onSuccess: () => { message.success('已删除'); queryClient.invalidateQueries({ queryKey: ['files'] }); },
    onError: () => message.error('删除失败'),
  });

  const handleDownload = async (id: string) => {
    try {
      const res = await fileApi.getDownloadUrl(id);
      const url = res.data;
      if (url) window.open(url, '_blank');
    } catch {
      message.error('下载失败');
    }
  };

  const columns: ColumnsType<FileAsset> = [
    {
      title: '文件名', dataIndex: 'originalName', key: 'name',
      render: (name: string) => <span><FileOutlined style={{ marginRight: 8 }} />{name}</span>,
    },
    {
      title: '大小', dataIndex: 'fileSize', key: 'size', width: 120,
      sorter: (a, b) => a.fileSize - b.fileSize,
      render: (size: number) => formatSize(size),
    },
    {
      title: '类型', dataIndex: 'mimeType', key: 'mimeType', width: 120,
      render: (t: string) => <Tag>{t?.split('/')[1]?.toUpperCase() || t}</Tag>,
    },
    {
      title: '上传时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', key: 'action', width: 260,
      render: (_: any, record: FileAsset) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}
            onClick={() => navigate(`/file/${record.id}/preview`)}>
            预览
          </Button>
          <Button type="link" size="small" icon={<SafetyOutlined />}
            onClick={() => setPermTarget({ type: 'file', id: record.id, name: record.originalName })}>
            权限
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id)}>下载</Button>
          <Popconfirm title="确定删除？" onConfirm={() => deleteMut.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const files = data?.data?.records || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>文件管理</Title>
        <Upload
          multiple
          customRequest={async ({ file, onSuccess, onError }: any) => {
            try {
              const res = await fileApi.upload(file as File);
              if (res.code === 200) {
                message.success(`${(file as File).name} 上传成功`);
                queryClient.invalidateQueries({ queryKey: ['files'] });
                onSuccess?.(res.data);
              } else {
                onError?.(new Error(res.message));
              }
            } catch (e: any) {
              message.error(`${(file as File).name} 上传失败`);
              onError?.(e);
            }
          }}
          showUploadList={false}
        >
          <Button type="primary" icon={<UploadOutlined />}>上传文件</Button>
        </Upload>
      </div>

      <Dragger
        multiple
        style={{ marginBottom: 16 }}
        customRequest={async ({ file, onSuccess, onError }: any) => {
          try {
            const res = await fileApi.upload(file as File);
            if (res.code === 200) {
              message.success(`${(file as File).name} 上传成功`);
              queryClient.invalidateQueries({ queryKey: ['files'] });
              onSuccess?.(res.data);
            } else {
              onError?.(new Error(res.message));
            }
          } catch (e: any) {
            message.error(`${(file as File).name} 上传失败`);
            onError?.(e);
          }
        }}
        showUploadList={false}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">支持批量上传，单个文件最大 50MB</p>
      </Dragger>

      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索文件（输入自动搜索）"
          style={{ width: 280 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      <Table
        columns={columns}
        dataSource={files}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.data?.total || 0,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 个文件`,
        }}
        locale={{ emptyText: '暂无文件' }}
      />

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
