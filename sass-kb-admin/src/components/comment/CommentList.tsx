import { useState, useCallback } from 'react';
import { Input, Button, Avatar, Typography, Space, Popconfirm, message, Spin } from 'antd';
import { SendOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi, type CommentNode } from '@/services/commentApi';

const { Text } = Typography;

function getColor(name: string) {
  const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff', '#13c2c2'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface CommentItemProps {
  comment: CommentNode;
  depth: number;
  replyingTo: string | null;
  replyContents: Record<string, string>;
  onReply: (parentId: string) => void;
  onCancelReply: () => void;
  onReplyContentChange: (parentId: string, value: string) => void;
  onSubmitReply: (parentId: string) => void;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

function CommentItem({ comment, depth, replyingTo, replyContents, onReply, onCancelReply, onReplyContentChange, onSubmitReply, deletingId, onDelete }: CommentItemProps) {
  const initials = comment.creatorName ? comment.creatorName.charAt(0).toUpperCase() : '?';
  const isReplying = replyingTo === comment.id;

  return (
    <div style={{ marginLeft: depth * 24, marginBottom: 12, padding: 8, borderLeft: depth > 0 ? '2px solid #f0f0f0' : undefined, paddingLeft: depth > 0 ? 16 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Avatar size={28} style={{ backgroundColor: getColor(comment.creatorName), flexShrink: 0 }}>
          {initials}
        </Avatar>
        <div style={{ flex: 1 }}>
          <Space size={8}>
            <Text strong>{comment.creatorName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {comment.createdAt?.substring(0, 16)}
            </Text>
          </Space>
          <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{comment.content}</div>
          <Space size={8} style={{ marginTop: 4 }}>
            <Button type="link" size="small" onClick={() => onReply(comment.id)}>
              回复
            </Button>
            <Popconfirm title="确定删除？" onConfirm={() => onDelete(comment.id)}>
              <Button type="link" size="small" danger loading={deletingId === comment.id}>
                <DeleteOutlined />
              </Button>
            </Popconfirm>
          </Space>
          {isReplying && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <Input.TextArea
                size="small"
                rows={2}
                value={replyContents[comment.id] || ''}
                onChange={e => onReplyContentChange(comment.id, e.target.value)}
                placeholder="回复..."
              />
              <Space size={4}>
                <Button type="primary" size="small" icon={<SendOutlined />}
                  onClick={() => onSubmitReply(comment.id)}>发送</Button>
                <Button size="small" onClick={onCancelReply}>取消</Button>
              </Space>
            </div>
          )}
        </div>
      </div>
      {comment.children?.map(child => (
        <CommentItem key={child.id} comment={child} depth={depth + 1}
          replyingTo={replyingTo} replyContents={replyContents}
          onReply={onReply} onCancelReply={onCancelReply}
          onReplyContentChange={onReplyContentChange}
          onSubmitReply={onSubmitReply}
          deletingId={deletingId} onDelete={onDelete} />
      ))}
    </div>
  );
}

interface Props {
  docId: string;
}

export default function CommentList({ docId }: Props) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [topLevelContent, setTopLevelContent] = useState('');
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['comments', docId],
    queryFn: () => commentApi.list(docId),
    enabled: !!docId,
  });

  const createMut = useMutation({
    mutationFn: (data: { documentId: string; content: string; parentId?: string }) =>
      commentApi.create(data),
    onSuccess: (_data, variables) => {
      message.success('评论已发送');
      if (!variables.parentId) {
        setTopLevelContent('');
      } else {
        setReplyContents(prev => {
          const next = { ...prev };
          delete next[variables.parentId!];
          return next;
        });
      }
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', docId] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => commentApi.delete(id),
    onSuccess: () => {
      message.success('已删除');
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['comments', docId] });
    },
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMut.mutate(id);
  };

  const handleReply = useCallback((parentId: string) => {
    setReplyingTo(parentId);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleReplyContentChange = useCallback((parentId: string, value: string) => {
    setReplyContents(prev => ({ ...prev, [parentId]: value }));
  }, []);

  const handleSubmitReply = useCallback((parentId: string) => {
    const content = replyContents[parentId];
    if (!content?.trim()) {
      message.warning('请输入回复内容');
      return;
    }
    createMut.mutate({ documentId: docId, content, parentId });
  }, [docId, replyContents, createMut]);

  const comments = data?.data || [];

  return (
    <div>
      {/* New top-level comment */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Input.TextArea
          rows={2}
          value={topLevelContent}
          onChange={e => setTopLevelContent(e.target.value)}
          placeholder="添加评论..."
        />
        <Button type="primary" icon={<SendOutlined />}
          onClick={() => createMut.mutate({ documentId: docId, content: topLevelContent })}
          loading={createMut.isPending}
          disabled={!topLevelContent.trim()}>发送</Button>
      </div>

      {isLoading ? (
        <Spin size="small" style={{ display: 'block', margin: '20px auto' }} />
      ) : comments.length === 0 ? (
        <Text type="secondary">暂无评论</Text>
      ) : (
        comments.map(c => (
          <CommentItem key={c.id} comment={c} depth={0}
            replyingTo={replyingTo} replyContents={replyContents}
            onReply={handleReply} onCancelReply={handleCancelReply}
            onReplyContentChange={handleReplyContentChange}
            onSubmitReply={handleSubmitReply}
            deletingId={deletingId} onDelete={handleDelete} />
        ))
      )}
    </div>
  );
}
