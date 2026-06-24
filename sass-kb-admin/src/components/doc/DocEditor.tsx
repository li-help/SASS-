import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
// TextAlign not used due to type compatibility; keeping editor simpler
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useEffect } from 'react';
import { useDocStore } from '@/stores/docStore';
import DocToolbar from './DocToolbar';

const lowlight = createLowlight(common);

interface Props {
  content: object | null;
  editable: boolean;
  onSave?: (json: object, html: string) => void;
}

export default function DocEditor({ content, editable, onSave }: Props) {
  const setEditor = useDocStore((s) => s.setEditor);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: '输入 "/" 唤起更多功能...' }),
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: content as never,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onSave?.(json, html);
    },
  });

  useEffect(() => {
    if (editor) setEditor(editor);
    return () => { setEditor(null); };
  }, [editor, setEditor]);

  // Re-set content when switching documents
  useEffect(() => {
    if (editor && content) {
      const currentJson = JSON.stringify(editor.getJSON());
      const newJson = JSON.stringify(content);
      if (currentJson !== newJson) {
        editor.commands.setContent(content as never);
      }
    }
  }, [content, editor]);

  return (
    <div className="doc-editor">
      {editable && <DocToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        style={{
          minHeight: 400,
          padding: '0 4px',
        }}
      />
      <style>{`
        .doc-editor .ProseMirror {
          outline: none;
          min-height: 400px;
          line-height: 1.8;
          font-size: 16px;
        }
        .doc-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .doc-editor .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
        }
        .doc-editor .ProseMirror td,
        .doc-editor .ProseMirror th {
          border: 1px solid #ced4da;
          padding: 8px 12px;
          min-width: 80px;
        }
        .doc-editor .ProseMirror th {
          background: #f8f9fa;
          font-weight: 600;
        }
        .doc-editor .ProseMirror pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
        }
        .doc-editor .ProseMirror pre code {
          color: inherit;
          font-size: 14px;
        }
        .doc-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
        }
        .doc-editor .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 16px;
          color: #6b7280;
        }
        .doc-editor .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .doc-editor .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .doc-editor .ProseMirror mark {
          background: #fef08a;
          padding: 0 2px;
        }
      `}</style>
    </div>
  );
}
