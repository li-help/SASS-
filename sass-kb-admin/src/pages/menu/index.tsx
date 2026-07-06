import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, Tag, Space, message,
  Popconfirm, Select, Switch, Radio, TreeSelect,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/services/menuApi';
import type { Menu } from '@/services/menuApi';

const MENU_TYPE_OPTIONS = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' },
];

const STATUS_OPTIONS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
];

const ICON_OPTIONS = [
  { label: 'DashboardOutlined - 仪表盘', value: 'DashboardOutlined' },
  { label: 'FolderOpenOutlined - 文件夹', value: 'FolderOpenOutlined' },
  { label: 'FileOutlined - 文件', value: 'FileOutlined' },
  { label: 'UserOutlined - 用户', value: 'UserOutlined' },
  { label: 'SafetyOutlined - 安全', value: 'SafetyOutlined' },
  { label: 'TeamOutlined - 团队', value: 'TeamOutlined' },
  { label: 'AuditOutlined - 审计', value: 'AuditOutlined' },
  { label: 'KeyOutlined - 钥匙', value: 'KeyOutlined' },
  { label: 'ShopOutlined - 商店', value: 'ShopOutlined' },
  { label: 'MenuOutlined - 菜单', value: 'MenuOutlined' },
  { label: 'SettingOutlined - 设置', value: 'SettingOutlined' },
  { label: 'BellOutlined - 通知', value: 'BellOutlined' },
  { label: 'LinkOutlined - 链接', value: 'LinkOutlined' },
  { label: 'StarOutlined - 星标', value: 'StarOutlined' },
  { label: 'AppstoreOutlined - 应用', value: 'AppstoreOutlined' },
  { label: 'DatabaseOutlined - 数据库', value: 'DatabaseOutlined' },
  { label: 'CloudOutlined - 云', value: 'CloudOutlined' },
  { label: 'ToolOutlined - 工具', value: 'ToolOutlined' },
  { label: 'LockOutlined - 锁', value: 'LockOutlined' },
  { label: 'UnlockOutlined - 解锁', value: 'UnlockOutlined' },
  { label: 'EyeOutlined - 眼睛', value: 'EyeOutlined' },
  { label: 'EditOutlined - 编辑', value: 'EditOutlined' },
  { label: 'DeleteOutlined - 删除', value: 'DeleteOutlined' },
  { label: 'SearchOutlined - 搜索', value: 'SearchOutlined' },
  { label: 'PlusOutlined - 新增', value: 'PlusOutlined' },
  { label: 'HomeOutlined - 首页', value: 'HomeOutlined' },
];

const MENU_TYPE_TAG: Record<string, { color: string; label: string }> = {
  M: { color: 'blue', label: '目录' },
  C: { color: 'green', label: '菜单' },
  F: { color: 'orange', label: '按钮' },
};

function buildTreeSelect(nodes: Menu[]): { title: string; value: string; key: string; children?: ReturnType<typeof buildTreeSelect> }[] {
  return nodes.map((n) => ({
    title: n.name,
    value: n.id,
    key: n.id,
    children: n.children?.length ? buildTreeSelect(n.children) : undefined,
  }));
}

function filterTree(nodes: Menu[], kw: string): Menu[] {
  if (!kw) return nodes;
  return nodes
    .filter((node) => {
      const nameMatch = node.name.includes(kw);
      const permsMatch = node.perms?.includes(kw);
      return nameMatch || permsMatch || (node.children?.length && filterTree(node.children, kw).length > 0);
    })
    .map((node) => ({
      ...node,
      children: node.children ? filterTree(node.children, kw) : undefined,
    }));
}

export default function MenuPage() {
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // 监听菜单类型变化以控制字段显隐
  const menuType = Form.useWatch('menuType', form);

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menuApi.tree(),
  });

  const createMut = useMutation({
    mutationFn: (values: Partial<Menu>) => menuApi.create(values),
    onSuccess: () => {
      message.success('创建成功');
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    onError: () => message.error('创建失败'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...values }: Partial<Menu> & { id: string }) => menuApi.update(id, values),
    onSuccess: () => {
      message.success('更新成功');
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    onError: () => message.error('更新失败'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => menuApi.delete(id),
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    onError: () => message.error('删除失败'),
  });

  const initDefaultsMut = useMutation({
    mutationFn: () => menuApi.initDefaults(),
    onSuccess: (res: any) => {
      message.success(`已创建 ${res.data?.length || 0} 个菜单`);
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    onError: () => message.error('初始化失败'),
  });

  const openCreate = (parentId?: string) => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      parentId: parentId || undefined,
      menuType: parentId ? 'C' : 'M',
      sortOrder: 0,
      visible: true,
      status: '0',
    });
    setModalOpen(true);
  };

  const openEdit = (record: Menu) => {
    setEditing(record);
    form.setFieldsValue({
      parentId: record.parentId || undefined,
      menuType: record.menuType,
      name: record.name,
      path: record.path || '',
      component: record.component || '',
      perms: record.perms || '',
      icon: record.icon || undefined,
      sortOrder: record.sortOrder ?? 0,
      visible: record.visible,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleFinish = (values: Record<string, unknown>) => {
    const payload = { ...values };
    // 根据菜单类型清理无关字段
    if (payload.menuType === 'M') {
      delete payload.component;
      delete payload.perms;
    } else if (payload.menuType === 'F') {
      delete payload.component;
      delete payload.path;
      delete payload.icon;
    }
    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload } as Partial<Menu> & { id: string });
    } else {
      createMut.mutate(payload as Partial<Menu>);
    }
  };

  const menuTree = data?.data || [];
  const filteredTree = keyword ? filterTree(menuTree, keyword) : menuTree;
  const treeSelectData = buildTreeSelect(menuTree);

  const columns = [
    {
      title: '菜单名称', dataIndex: 'name', key: 'name', width: 220,
      render: (v: string, record: Menu) => (
        <Space>
          <Tag color={MENU_TYPE_TAG[record.menuType]?.color}>{MENU_TYPE_TAG[record.menuType]?.label}</Tag>
          <span>{v}</span>
        </Space>
      ),
    },
    { title: '图标', dataIndex: 'icon', key: 'icon', width: 100, render: (v: string) => v || '-' },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 70 },
    {
      title: '权限标识', dataIndex: 'perms', key: 'perms', width: 180, ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '组件路径', dataIndex: 'component', key: 'component', width: 180, ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v: string) => (
        <Tag color={v === '0' ? 'green' : 'red'}>{v === '0' ? '正常' : '停用'}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: (t: string) => t?.substring(0, 10) },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right' as const,
      render: (_: unknown, record: Menu) => (
        <Space size={0}>
          {record.menuType !== 'F' && (
            <Button type="link" size="small" onClick={() => openCreate(record.id)}>新增</Button>
          )}
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？子菜单将一并删除" onConfirm={() => deleteMut.mutate(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索菜单名称或权限标识"
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Space>
          {(filteredTree.length === 0 && !isLoading) && (
            <Button onClick={() => initDefaultsMut.mutate()} loading={initDefaultsMut.isPending}>
              初始化默认菜单
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
            新建菜单
          </Button>
        </Space>
      </div>

      {/* 树形表格 */}
      <Table
        columns={columns}
        dataSource={filteredTree}
        rowKey="id"
        loading={isLoading}
        defaultExpandAllRows
        pagination={false}
        size="middle"
        scroll={{ x: 1100 }}
        locale={{ emptyText: '暂无菜单，请新建' }}
      />

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editing ? '编辑菜单' : '新建菜单'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending || updateMut.isPending}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ menuType: 'M', sortOrder: 0, visible: true, status: '0' }}>
          {/* 父菜单 */}
          <Form.Item name="parentId" label="父菜单">
            <TreeSelect
              allowClear
              placeholder="选择父菜单（留空为根目录）"
              treeData={treeSelectData}
              treeDefaultExpandAll
              filterTreeNode={(input, node) =>
                String(node?.title ?? '').includes(input)
              }
            />
          </Form.Item>

          {/* 菜单类型 */}
          <Form.Item name="menuType" label="菜单类型" rules={[{ required: true }]}>
            <Radio.Group options={MENU_TYPE_OPTIONS} />
          </Form.Item>

          {/* 菜单名称 */}
          <Form.Item name="name" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input placeholder="如：用户管理" />
          </Form.Item>

          {/* 路由地址 — 目录/菜单 */}
          {(menuType === 'M' || menuType === 'C') && (
            <Form.Item name="path" label="路由地址"
              rules={menuType === 'C' ? [{ required: true, message: '请输入路由地址' }] : undefined}>
              <Input placeholder="如：/system/user" />
            </Form.Item>
          )}

          {/* 组件路径 — 仅菜单 */}
          {menuType === 'C' && (
            <Form.Item name="component" label="组件路径"
              rules={[{ required: true, message: '请输入组件路径' }]}>
              <Input placeholder="如：system/user/index" />
            </Form.Item>
          )}

          {/* 权限标识 — 菜单/按钮 */}
          {(menuType === 'C' || menuType === 'F') && (
            <Form.Item name="perms" label="权限标识"
              rules={[{ required: true, message: '请输入权限标识' }]}>
              <Input placeholder="如：system:user:list" />
            </Form.Item>
          )}

          {/* 图标 — 目录/菜单 */}
          {(menuType === 'M' || menuType === 'C') && (
            <Form.Item name="icon" label="图标">
              <Select
                allowClear
                placeholder="选择图标"
                options={ICON_OPTIONS}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}

          {/* 排序 */}
          <Form.Item name="sortOrder" label="显示排序">
            <Input type="number" placeholder="数值越小越靠前" />
          </Form.Item>

          {/* 可见 + 状态 */}
          <Space size={40}>
            <Form.Item name="visible" label="是否可见" valuePropName="checked">
              <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
            </Form.Item>
            <Form.Item name="status" label="菜单状态">
              <Radio.Group options={STATUS_OPTIONS} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
