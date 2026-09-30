"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export function RichTextEditor({ value, onChange, ariaLabel = "Rich text editor", compact = false }: { value: string; onChange: (value: string) => void; ariaLabel?: string; compact?: boolean }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } } })],
    content: value,
    immediatelyRender: false,
    editorProps: { attributes: { "aria-label": ariaLabel, role: "textbox" } },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });
  useEffect(() => { if (editor && editor.getHTML() !== value) editor.commands.setContent(value); }, [editor, value]);
  const command = (action: () => boolean) => () => { action(); editor?.commands.focus(); };
  const setLink = () => {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Enter an HTTPS link, or leave blank to remove it.", current || "https://");
    if (href === null) return;
    if (!href.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };
  const buttons = [
    ["Bold", "B", () => editor?.chain().focus().toggleBold().run() || false, editor?.isActive("bold")],
    ["Italic", "I", () => editor?.chain().focus().toggleItalic().run() || false, editor?.isActive("italic")],
    ["Heading level 2", "H2", () => editor?.chain().focus().toggleHeading({ level: 2 }).run() || false, editor?.isActive("heading", { level: 2 })],
    ["Heading level 3", "H3", () => editor?.chain().focus().toggleHeading({ level: 3 }).run() || false, editor?.isActive("heading", { level: 3 })],
    ["Bullet list", "• List", () => editor?.chain().focus().toggleBulletList().run() || false, editor?.isActive("bulletList")],
    ["Numbered list", "1. List", () => editor?.chain().focus().toggleOrderedList().run() || false, editor?.isActive("orderedList")],
    ["Blockquote", "Quote", () => editor?.chain().focus().toggleBlockquote().run() || false, editor?.isActive("blockquote")],
  ] as const;
  return <div className={`editor ${compact ? "compact" : ""}`}><div className="editor-toolbar" role="toolbar" aria-label="Text formatting">{buttons.map(([label, text, action, active]) => <button key={label} type="button" aria-label={label} aria-pressed={Boolean(active)} className={active ? "active" : ""} onClick={command(action)} disabled={!editor}>{text}</button>)}<button type="button" aria-label="Add or edit link" aria-pressed={Boolean(editor?.isActive("link"))} className={editor?.isActive("link") ? "active" : ""} onClick={setLink}>Link</button><button type="button" aria-label="Remove formatting" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>Clear</button><button type="button" aria-label="Undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>Undo</button><button type="button" aria-label="Redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>Redo</button></div><EditorContent className="editor-content" editor={editor}/></div>;
}
