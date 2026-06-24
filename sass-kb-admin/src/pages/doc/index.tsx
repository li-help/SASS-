import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Layout, Spin, message, Tabs, Space as AntSpace, Tag } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, ClockCircleOutlined, FileTextOutlined, CommentOutlined, SendOutlined, StopOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceTree from '@/components/tree/SpaceTree';
import DocEditor from '@/components/doc/DocEditor';
import DocOutline from '@/components/doc/DocOutline';
import VersionHistory from '@/components/doc/VersionHistory';
import CommentList from '@/components/comment/CommentList';
import { useDocStore } from '@/stores/docStore';
import { docApi, spaceApi } from '@/services/docService';
import type { DocSaveRequest } from '@/services/docService';
import { usePermission } from '@/hooks/usePermission';

const { Title, Text } = Typography;
const { Sider, Content } = Layout;

export default function DocPage() {
  const { spaceId, docId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCurrentVersion, currentVersion, setIsSaving, lastSavedAt } = useDocStore();
  const [activeTab, setActiveTab] = useState('outline');
  const [pendingSave, setPendingSave] = useState<{ json: object; html: string } | null>(null);
  const { data: canWrite } = usePermission('doc', docId!, 'write');

  // 获取目录树
  const { data: treeData, isLoading: treeLoading, refetch: refetchTree } = useQuery({
    queryKey: ['space-tree', spaceId],
    queryFn: () => spaceApi.getTree(spaceId!),
    enabled: !!spaceId,
  });

  // 获取文档详情
  const { data: docData, isLoading: docLoading } = useQuery({
    queryKey: ['doc', docId],
    queryFn: () => docApi.getById(docId!),
    enabled: !!docId,
  });

  // 保存 mutation
  const saveMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocSaveRequest }) => docApi.save(id, data),
    onSuccess: (res) => {
      setIsSaving(false);
      message.success('已保存');
      const v = res.data?.version;
      if (v) setCurrentVersion(v);
      queryClient.invalidateQueries({ queryKey: ['doc', docId] });
      queryClient.invalidateQueries({ queryKey: ['space-tree', spaceId] });
    },
    onError: (err: any) => {
      setIsSaving(false);
      if (err?.response?.data?.code === 409) {
        message.error('版本冲突：文档已被他人修改，请刷新后重试');
      } else {
        message.error('保存失败');
      }
    },
  });

  useEffect(() => {
    if (docData?.data) {
      setCurrentVersion(docData.data.version);
    }
  }, [docData, setCurrentVersion]);

  const handleSave = useCallback((json: object, html: string) => {
    setPendingSave({ json, html });
  }, []);

  const doSave = useCallback(() => {
    if (!docId || !pendingSave || !docData?.data) return;
    setIsSaving(true);
    saveMut.mutate({
      id: docId,
      data: {
        title: docData.data.title,
        contentJson: JSON.stringify(pendingSave.json),
        contentHtml: pendingSave.html,
        version: currentVersion,
      },
    });
  }, [docId, pendingSave, docData, currentVersion, saveMut, setIsSaving]);

  // 状态变更 mutation
  const statusMut = useMutation({
    mutationFn: (status: string) => docApi.updateStatus(docId!, status),
    onSuccess: () => {
      message.success('状态已更新');
      queryClient.invalidateQueries({ queryKey: ['doc', docId] });
      queryClient.invalidateQueries({ queryKey: ['space-tree', spaceId] });
    },
    onError: () => message.error('状态更新失败'),
  });

  // Ctrl+S 保存
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        doSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doSave]);

  const doc = docData?.data;
  const treeNodes = treeData?.data || [];

  // 如果 URL 是 /doc/:docId 但没有 spaceId，则加载该文档的 space
  if (docId && !spaceId && doc) {
    navigate(`/space/${doc.spaceId}/doc/${docId}`, { replace: true });
    return <Spin style={{ display: 'block', margin: '60px auto' }} />;
  }

  return (
    <Layout style={{ background: 'transparent', minHeight: 'calc(100vh - 160px)' }}>
      {/* 左侧目录树 */}
      <Sider width={280} style={{ background: '#fff', borderRadius: 8, padding: '12px 0', marginRight: 16, overflow: 'auto' }}>
        <div style={{ padding: '0 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/space')} size="small">
            返回
          </Button>
          <Button type="text" size="small" onClick={() => refetchTree()}>
            刷新
          </Button>
        </div>
        {treeLoading ? (
          <Spin size="small" style={{ display: 'block', margin: '20px auto' }} />
        ) : (
          <SpaceTree treeData={treeNodes} spaceId={spaceId!} onRefresh={refetchTree} />
        )}
      </Sider>

      {/* 主编辑区 */}
      <Content style={{ background: '#fff', borderRadius: 8, padding: 24, overflow: 'auto' }}>
        {docId && docLoading ? (
          <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />
        ) : docId && doc ? (
          <>
            {/* 标题栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>{doc.title}</Title>
                <AntSpace size="small" style={{ marginTop: 4 }}>
                  <Tag color={doc.status === 'published' ? 'green' : doc.status === 'draft' ? 'gold' : 'default'}>
                    {doc.status === 'draft' ? '草稿' : doc.status === 'published' ? '已发布' : '已归档'}
                  </Tag>
                  <Text type="secondary">版本: v{doc.version}</Text>
                  {lastSavedAt && <Text type="success">上次保存: {lastSavedAt.toLocaleTimeString()}</Text>}
                  {canWrite && doc.status === 'draft' && (
                    <Button size="small" type="primary" ghost icon={<SendOutlined />}
                      onClick={() => statusMut.mutate('published')} loading={statusMut.isPending}>
                      发布
                    </Button>
                  )}
                  {canWrite && doc.status === 'published' && (
                    <Button size="small" icon={<StopOutlined />}
                      onClick={() => statusMut.mutate('archived')} loading={statusMut.isPending}>
                      归档
                    </Button>
                  )}
                  {canWrite && doc.status === 'archived' && (
                    <Button size="small" icon={<EditOutlined />}
                      onClick={() => statusMut.mutate('draft')} loading={statusMut.isPending}>
                      重新编辑
                    </Button>
                  )}
                </AntSpace>
              </div>
              <AntSpace>
                {canWrite && (
                  <Button icon={<SaveOutlined />} type="primary" onClick={doSave} loading={saveMut.isPending}>
                    保存
                  </Button>
                )}
              </AntSpace>
            </div>

            {/* 编辑器 */}
            <DocEditor
              content={doc.contentJson ? JSON.parse(doc.contentJson) : null}
              editable={true}
              onSave={handleSave}
            />
          </>
        ) : spaceId ? (
          // 没有选中文档时的空状态
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
            <Title level={4} type="secondary" style={{ marginTop: 16 }}>选择左侧目录中的文档开始编辑</Title>
            <Text type="secondary">或右键文件夹创建新文档</Text>
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
            <Title level={4} type="secondary" style={{ marginTop: 16 }}>请选择一个知识空间</Title>
          </div>
        )}
      </Content>

      {/* 右侧面板 */}
      {docId && doc && (
        <Sider width={260} style={{ background: '#fff', borderRadius: 8, padding: '12px 0', marginLeft: 16, overflow: 'auto' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ padding: '0 12px' }}
            items={[
              {
                key: 'outline',
                label: '大纲',
                children: <DocOutline editor={useDocStore.getState().editor} />,
              },
              {
                key: 'versions',
                label: (
                  <span><ClockCircleOutlined /> 版本</span>
                ),
                children: <VersionHistory docId={docId} />,
              },
              {
                key: 'comments',
                label: (
                  <span><CommentOutlined /> 评论</span>
                ),
                children: <CommentList docId={docId} />,
              },
            ]}
          />
        </Sider>
      )}
    </Layout>
  );
}
