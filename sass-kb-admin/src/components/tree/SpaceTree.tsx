import { Tree, Dropdown, message, Modal, Input } from 'antd';
import type { MenuProps } from 'antd';
import {
  FolderOutlined, FileTextOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, FolderAddOutlined,
} from '@ant-design/icons';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SpaceTreeNode } from '@/services/docService';
import { folderApi, docApi } from '@/services/docService';

interface Props {
  treeData: SpaceTreeNode[];
  spaceId: string;
  onRefresh: () => void;
  onFolderSelect?: (folderId: string, folderName: string) => void;
}

export default function SpaceTree({ treeData, spaceId, onRefresh, onFolderSelect }: Props) {
  const navigate = useNavigate();
  const [newItemModal, setNewItemModal] = useState<{ type: 'folder' | 'doc'; parentId?: string } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 递归查找树节点
  const findNode = (nodes: SpaceTreeNode[], id: string): SpaceTreeNode | undefined => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  // 右键菜单
  const getContextMenu = (node: SpaceTreeNode): MenuProps['items'] => {
    const items: MenuProps['items'] = [];

    if (node.type === 'folder' || node.type === 'space') {
      items.push({
        key: 'new-folder',
        icon: <FolderAddOutlined />,
        label: '新建子文件夹',
        onClick: () => setNewItemModal({ type: 'folder', parentId: node.id }),
      });
      items.push({
        key: 'new-doc',
        icon: <PlusOutlined />,
        label: '新建文档',
        onClick: () => setNewItemModal({ type: 'doc', parentId: node.type === 'folder' ? node.id : undefined }),
      });
    }

    if (node.type === 'folder') {
      items.push({ type: 'divider' });
      items.push({
        key: 'rename',
        icon: <EditOutlined />,
        label: '重命名',
        onClick: () => {
          const name = window.prompt('新名称:', node.name);
          if (name && name !== node.name) {
            folderApi.update(node.id, { name }).then(() => onRefresh());
          }
        },
      });
      items.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: '确认删除',
            content: `确定要删除文件夹「${node.name}」及其所有内容吗？`,
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => folderApi.delete(node.id).then(() => { message.success('已删除'); onRefresh(); }),
          });
        },
      });
    }

    if (node.type === 'doc') {
      items.push({
        key: 'delete-doc',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: '确认删除',
            content: `确定要删除文档「${node.name}」吗？`,
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => docApi.delete(node.id).then(() => { message.success('已删除'); onRefresh(); }),
          });
        },
      });
    }

    return items;
  };

  // 生成 Tree 数据
  const treeItems = useMemo(() => {
    const convert = (nodes: SpaceTreeNode[]): any[] =>
      nodes.map((node) => ({
        key: node.id,
        title: node.name,
        icon: node.type === 'folder' ? <FolderOutlined /> : <FileTextOutlined />,
        isLeaf: node.type === 'doc',
        nodeType: node.type,
        children: node.children ? convert(node.children) : undefined,
      }));
    return convert(treeData);
  }, [treeData]);

  const handleSelect = (_selectedKeys: React.Key[], info: any) => {
    const node = info.node;
    if (node.isLeaf) {
      navigate(`/doc/${node.key}`);
    } else if (node.nodeType === 'folder') {
      // 点击文件夹节点，展示该文件夹下的文档列表
      onFolderSelect?.(node.key, node.title);
    }
  };

  const handleCreate = async () => {
    if (!nameInput.trim() || !newItemModal) return;
    setLoading(true);
    try {
      if (newItemModal.type === 'folder') {
        await folderApi.create({
          spaceId,
          parentId: newItemModal.parentId,
          name: nameInput.trim(),
        });
        message.success('文件夹已创建');
      } else {
        await docApi.create({
          spaceId,
          folderId: newItemModal.parentId,
          title: nameInput.trim() || '未命名文档',
        });
        message.success('文档已创建');
      }
      setNewItemModal(null);
      setNameInput('');
      onRefresh();
    } catch {
      message.error('创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tree
        showIcon
        defaultExpandAll
        treeData={treeItems}
        onSelect={handleSelect}
        titleRender={(nodeData: any) => (
          <Dropdown menu={{ items: getContextMenu(findNode(treeData, nodeData.key) as SpaceTreeNode) || [] }} trigger={['contextMenu']}>
            <span style={{ userSelect: 'none' }}>{nodeData.title}</span>
          </Dropdown>
        )}
        style={{ padding: '8px 0' }}
      />

      <Modal
        title={newItemModal?.type === 'folder' ? '新建文件夹' : '新建文档'}
        open={!!newItemModal}
        onOk={handleCreate}
        onCancel={() => { setNewItemModal(null); setNameInput(''); }}
        confirmLoading={loading}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder={newItemModal?.type === 'folder' ? '文件夹名称' : '文档标题'}
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onPressEnter={handleCreate}
        />
      </Modal>
    </>
  );
}
