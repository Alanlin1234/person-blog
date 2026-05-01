import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export function RichEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Placeholder.configure({ placeholder: 'Write your post…' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return <div className="min-h-[240px] rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">Loading editor…</div>;

  return (
    <div className="rounded border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800">
        <button type="button" className="rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </button>
        <button type="button" className="rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </button>
        <button type="button" className="rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button type="button" className="rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          List
        </button>
      </div>
      <EditorContent editor={editor} className="prose prose-zinc max-w-none p-4 dark:prose-invert" />
    </div>
  );
}
