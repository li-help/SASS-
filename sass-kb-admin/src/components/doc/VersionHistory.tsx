import { useState } from 'react';
import { List, Tag, Spin, Empty, Button, Modal, message, Popconfirm } from 'antd';
import { ClockCircleOutlined, EyeOutlined, DiffOutlined, RollbackOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docApi } from '@/services/docService';
import type { DocumentVersion } from '@/services/docService';
import VersionDiff from './VersionDiff';

interface Props {
  docId: string;
}

export default function VersionHistory({ docId }: Props) {
  const [diffModal, setDiffModal] = useState<{ v1: number; v2: number } | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['doc-versions', docId],
    queryFn: () => docApi.getVersions(docId),
  });

  const versions = data?.data || [];

  const restoreMut = useMutation({
    mutationFn: (versionNumber: number) => docApi.restoreVersion(docId, versionNumber),
    onSuccess: () => {
      message.success('版本已恢复');
      queryClient.invalidateQueries({ queryKey: ['doc-versions', docId] });
      queryClient.invalidateQueries({ queryKey: ['doc', docId] });
    },
    onError: () => message.error('恢复失败'),
  });

  if (isLoading) {
    return <Spin size="small" style={{ display: 'block', margin: '20px auto' }} />;
  }

  if (versions.length === 0) {
    return <Empty description="暂无历史版本" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <List
        size="small"
        dataSource={versions}
        renderItem={(v: DocumentVersion, index: number) => {
          const isLatest = index === 0;
          return (
            <List.Item
              style={{ cursor: 'pointer', padding: '8px 0' }}
              actions={[
                <Button
                  key="view"
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewHtml(v.contentHtml)}
                >
                  查看
                </Button>,
                index < versions.length - 1 ? (
                  <Button
                    key="diff"
                    type="link"
                    size="small"
                    icon={<DiffOutlined />}
                    onClick={() => setDiffModal({
                      v1: v.versionNumber,
                      v2: versions[index + 1]?.versionNumber ?? v.versionNumber,
                    })}
                  >
                    对比
                  </Button>
                ) : null,
                !isLatest ? (
                  <Popconfirm
                    key="restore"
                    title="恢复版本"
                    description={`确定恢复到 v${v.versionNumber}？当前内容将作为新版本保存。`}
                    onConfirm={() => restoreMut.mutate(v.versionNumber)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="link"
                      size="small"
                      icon={<RollbackOutlined />}
                      loading={restoreMut.isPending}
                    >
                      恢复
                    </Button>
                  </Popconfirm>
                ) : null,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<ClockCircleOutlined style={{ color: isLatest ? '#1677ff' : '#8c8c8c' }} />}
                title={
                  <span>
                    v{v.versionNumber}
                    {isLatest && <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>最新</Tag>}
                  </span>
                }
                description={
                  v.changeSummary || '保存于 ' + (v.createdAt ? new Date(v.createdAt).toLocaleString('zh-CN') : '-')
                }
              />
            </List.Item>
          );
        }}
      />

      {/* 版本预览 */}
      <Modal
        title="版本内容预览"
        open={!!previewHtml}
        onCancel={() => setPreviewHtml(null)}
        footer={null}
        width={800}
      >
        <div
          dangerouslySetInnerHTML={{ __html: previewHtml || '' }}
          style={{ maxHeight: 500, overflow: 'auto', padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}
        />
      </Modal>

      {/* Diff 对比 */}
      <Modal
        title={`版本对比: v${diffModal?.v2} → v${diffModal?.v1}`}
        open={!!diffModal}
        onCancel={() => setDiffModal(null)}
        footer={null}
        width={900}
      >
        {diffModal && <VersionDiff docId={docId} v1={diffModal.v1} v2={diffModal.v2} />}
      </Modal>
    </div>
  );
}
