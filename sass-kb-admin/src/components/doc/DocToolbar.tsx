import { Button, Tooltip, Divider } from 'antd';
import {
  BoldOutlined, ItalicOutlined, StrikethroughOutlined,
  OrderedListOutlined, UnorderedListOutlined,
  UndoOutlined, RedoOutlined, HighlightOutlined,
  TableOutlined, CodeOutlined, LinkOutlined,
  PictureOutlined, CheckSquareOutlined,
} from '@ant-design/icons';
import type { Editor } from '@tiptap/react';

interface Props {
  editor: Editor | null;
}

export default function DocToolbar({ editor }: Props) {
  if (!editor) return null;

  const ToolBtn = ({ icon, onClick, active, title }: {
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    title: string;
  }) => (
    <Tooltip title={title}>
      <Button
        type={active ? 'primary' : 'text'}
        size="small"
        icon={icon}
        onClick={onClick}
        style={{ marginRight: 2 }}
      />
    </Tooltip>
  );

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      <ToolBtn title="加粗" icon={<BoldOutlined />} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolBtn title="斜体" icon={<ItalicOutlined />} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolBtn title="删除线" icon={<StrikethroughOutlined />} active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <ToolBtn title="高亮" icon={<HighlightOutlined />} active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} />
      <ToolBtn title="代码块" icon={<CodeOutlined />} active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />

      <Divider type="vertical" />

      <ToolBtn title="有序列表" icon={<OrderedListOutlined />} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolBtn title="无序列表" icon={<UnorderedListOutlined />} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolBtn title="任务列表" icon={<CheckSquareOutlined />} active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} />

      <Divider type="vertical" />

      <ToolBtn title="插入表格" icon={<TableOutlined />} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
      <ToolBtn title="插入图片" icon={<PictureOutlined />} onClick={() => {
        const url = window.prompt('输入图片 URL:');
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }} />
      <ToolBtn title="插入链接" icon={<LinkOutlined />} onClick={() => {
        const url = window.prompt('输入链接 URL:');
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }} />

      <Divider type="vertical" />

      <ToolBtn title="撤销" icon={<UndoOutlined />} onClick={() => editor.chain().focus().undo().run()} />
      <ToolBtn title="重做" icon={<RedoOutlined />} onClick={() => editor.chain().focus().redo().run()} />
    </div>
  );
}
