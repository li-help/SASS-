import { Typography, Empty } from 'antd';
import type { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';

const { Text } = Typography;

interface Heading {
  level: number;
  text: string;
  pos: number;
}

interface Props {
  editor: Editor | null;
}

export default function DocOutline({ editor }: Props) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      const items: Heading[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          items.push({
            level: node.attrs.level,
            text: node.textContent,
            pos,
          });
        }
      });
      setHeadings(items);
    };

    updateHeadings();
    editor.on('update', updateHeadings);
    return () => { editor.off('update', updateHeadings); };
  }, [editor]);

  if (headings.length === 0) {
    return <Empty description="暂无标题" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {headings.map((h, i) => (
        <div
          key={i}
          style={{
            paddingLeft: (h.level - 1) * 16,
            paddingTop: 4,
            paddingBottom: 4,
            cursor: 'pointer',
          }}
          onClick={() => {
            if (editor) {
              editor.chain().focus().setTextSelection(h.pos).run();
            }
          }}
        >
          <Text
            ellipsis
            style={{
              fontSize: h.level <= 2 ? 14 : 13,
              color: h.level <= 2 ? '#1f1f1f' : '#8c8c8c',
              fontWeight: h.level <= 2 ? 500 : 400,
            }}
          >
            {h.text}
          </Text>
        </div>
      ))}
    </div>
  );
}
