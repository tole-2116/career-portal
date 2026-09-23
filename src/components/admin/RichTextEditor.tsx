import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Rich text editor used for article bodies; stores HTML. */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {
        class:
          "rich-text min-h-40 px-3 py-2 text-sm focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const action = (
    label: string,
    Icon: typeof Bold,
    run: () => void,
    active = false,
    disabled = false,
  ) => (
    <Button
      key={label}
      type="button"
      size="icon"
      variant="ghost"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn("h-8 w-8", active && "bg-muted text-foreground")}
      onClick={run}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="rounded-md border border-input bg-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
        {action("Đậm", Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
        {action(
          "Nghiêng",
          Italic,
          () => editor.chain().focus().toggleItalic().run(),
          editor.isActive("italic"),
        )}
        {action(
          "Tiêu đề lớn",
          Heading2,
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive("heading", { level: 2 }),
        )}
        {action(
          "Tiêu đề nhỏ",
          Heading3,
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          editor.isActive("heading", { level: 3 }),
        )}
        {action(
          "Danh sách",
          List,
          () => editor.chain().focus().toggleBulletList().run(),
          editor.isActive("bulletList"),
        )}
        {action(
          "Danh sách số",
          ListOrdered,
          () => editor.chain().focus().toggleOrderedList().run(),
          editor.isActive("orderedList"),
        )}
        {action(
          "Trích dẫn",
          Quote,
          () => editor.chain().focus().toggleBlockquote().run(),
          editor.isActive("blockquote"),
        )}
        {action(
          "Liên kết",
          Link2,
          () => {
            const previous = (editor.getAttributes("link")["href"] as string | undefined) ?? "";
            const url = window.prompt("Đường dẫn liên kết", previous);
            if (url === null) return;
            if (!url.trim()) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
          },
          editor.isActive("link"),
        )}
        <span className="mx-1 h-5 w-px bg-border" />
        {action(
          "Hoàn tác",
          Undo2,
          () => editor.chain().focus().undo().run(),
          false,
          !editor.can().undo(),
        )}
        {action(
          "Làm lại",
          Redo2,
          () => editor.chain().focus().redo().run(),
          false,
          !editor.can().redo(),
        )}
      </div>
      <EditorContent editor={editor} />
      {placeholder && editor.isEmpty && (
        <p className="pointer-events-none -mt-9 px-3 text-sm text-muted-foreground">{placeholder}</p>
      )}
    </div>
  );
}
