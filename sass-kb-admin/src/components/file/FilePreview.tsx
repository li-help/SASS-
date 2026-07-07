import { useState, useEffect } from 'react';
import { Spin, Button, message, Result, Typography } from 'antd';
import { DownloadOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fileApi } from '@/services/fileService';
import type { FileAsset } from '@/services/fileService';

const { Text } = Typography;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const TEXT_MIME_TYPES = [
  'text/plain', 'text/csv', 'application/json',
  'text/markdown', 'text/xml', 'text/html',
  'text/css', 'text/javascript', 'application/javascript',
];
const TEXT_EXTENSIONS = ['txt', 'csv', 'json', 'md', 'xml', 'yml', 'yaml',
  'html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx', 'java', 'py', 'sh', 'sql', 'properties', 'ini', 'log'];

function isImage(mime: string) { return IMAGE_TYPES.includes(mime); }
function isVideo(mime: string) { return mime === 'video/mp4'; }
function isPdf(mime: string) { return mime === 'application/pdf'; }
function isText(file: FileAsset): boolean {
  if (TEXT_MIME_TYPES.includes(file.mimeType)) return true;
  const name = file.originalName?.toLowerCase() || '';
  const ext = name.substring(name.lastIndexOf('.') + 1);
  return TEXT_EXTENSIONS.includes(ext);
}

function getLanguage(file: FileAsset): string {
  const name = file.originalName?.toLowerCase() || '';
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.md')) return 'markdown';
  if (name.endsWith('.xml') || name.endsWith('.html') || name.endsWith('.htm')) return 'xml';
  if (name.endsWith('.css')) return 'css';
  if (name.endsWith('.js') || name.endsWith('.mjs')) return 'javascript';
  if (name.endsWith('.ts')) return 'typescript';
  if (name.endsWith('.tsx')) return 'typescript';
  if (name.endsWith('.jsx')) return 'javascript';
  if (name.endsWith('.py')) return 'python';
  if (name.endsWith('.java')) return 'java';
  if (name.endsWith('.sh') || name.endsWith('.bash')) return 'shell';
  if (name.endsWith('.sql')) return 'sql';
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return 'yaml';
  if (name.endsWith('.csv')) return 'plaintext';
  return 'plaintext';
}

interface Props {
  fileId: string;
  onBack: () => void;
}

export default function FilePreview({ fileId, onBack }: Props) {
  const [editingContent, setEditingContent] = useState<string | null>(null);

  const { data: fileData, isLoading } = useQuery({
    queryKey: ['file', fileId],
    queryFn: () => fileApi.getById(fileId),
  });

  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['file-content', fileId],
    queryFn: () => fileApi.getContent(fileId),
    enabled: !!fileData && isText(fileData.data),
  });

  const saveMut = useMutation({
    mutationFn: (content: string) => fileApi.saveContent(fileId, content),
    onSuccess: () => message.success('保存成功'),
    onError: () => message.error('保存失败'),
  });

  useEffect(() => {
    if (contentData?.data !== undefined) {
      setEditingContent(contentData.data);
    }
  }, [contentData]);

  const file = fileData?.data;

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;
  }

  if (!file) {
    return <Result status="error" title="文件不存在" />;
  }

  const handleDownload = async () => {
    try {
      const res = await fileApi.getDownloadUrl(fileId);
      if (res.data) window.open(res.data, '_blank');
    } catch {
      message.error('下载失败');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button>
          <Text strong style={{ fontSize: 16 }}>{file.originalName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {file.mimeType} · {(file.fileSize / 1024).toFixed(1)} KB
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isText(file) && (
            <Button type="primary" icon={<SaveOutlined />}
              loading={saveMut.isPending}
              onClick={() => editingContent !== null && saveMut.mutate(editingContent)}>
              保存
            </Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>下载</Button>
        </div>
      </div>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden', minHeight: 400 }}>
        {isImage(file.mimeType) && (
          <div style={{ display: 'flex', justifyContent: 'center', background: '#f5f5f5', padding: 24 }}>
            <img src={`/api/file/${fileId}/download-file`} alt={file.originalName}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          </div>
        )}

        {isVideo(file.mimeType) && (
          <div style={{ display: 'flex', justifyContent: 'center', background: '#000', padding: 24 }}>
            <video controls style={{ maxWidth: '100%', maxHeight: '70vh' }}
              src={`/api/file/${fileId}/download-file`}>
              您的浏览器不支持视频播放
            </video>
          </div>
        )}

        {isPdf(file.mimeType) && (
          <iframe src={`/api/file/${fileId}/download-file`}
            style={{ width: '100%', height: '75vh', border: 'none' }} />
        )}

        {isText(file) && (
          contentLoading ? (
            <Spin style={{ display: 'block', padding: 40 }} />
          ) : (
            <Editor
              height="70vh"
              language={getLanguage(file)}
              value={editingContent || ''}
              onChange={(value) => setEditingContent(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          )
        )}

        {!isImage(file.mimeType) && !isVideo(file.mimeType) && !isPdf(file.mimeType) && !isText(file) && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, flexDirection: 'column', gap: 16 }}>
            <Text type="secondary">此文件类型不支持在线预览</Text>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
              下载到本地编辑
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
