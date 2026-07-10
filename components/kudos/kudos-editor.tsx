"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useTranslations } from "next-intl";
import { createMentionExtension } from "@/components/kudos/mention-suggestion";
import { KudosEditorLinkDialog } from "@/components/kudos/kudos-editor-link-dialog";
import { KudosEditorToolbar } from "@/components/kudos/kudos-editor-toolbar";
import { MAX_KUDOS_CONTENT_CHARS } from "@/lib/kudos/validation";

// `inclusive: false` stops the link mark from bleeding into text typed right
// before/after a link (ProseMirror's default `inclusive: true` extends it).
const KudosLink = Link.extend({ inclusive: false });

export type KudosEditorHandle = {
  /** Walks the current doc JSON and returns the deduped set of mentioned profile ids. */
  getMentionedIds: () => string[];
};

type KudosEditorProps = {
  onContentChange: (html: string, isEmpty: boolean) => void;
};

function collectMentionIds(node: JSONContent, ids: Set<string>): void {
  if (node.type === "mention" && typeof node.attrs?.id === "string") {
    ids.add(node.attrs.id);
  }
  node.content?.forEach((child) => collectMentionIds(child, ids));
}

/**
 * Walks the doc's text nodes once, returning the plain-text length and (when
 * over `maxLength`) the exact doc position to truncate at. Counts text-node
 * characters only — unlike `editor.getText().length`, which also inserts a
 * separator between paragraphs.
 */
function measureEditorText(doc: Editor["state"]["doc"], maxLength: number): { length: number; truncateAt: number | null } {
  let length = 0;
  let truncateAt: number | null = null;
  doc.descendants((node, pos) => {
    if (truncateAt !== null) return false;
    if (!node.isText) return true;
    const nodeLength = node.text?.length ?? 0;
    if (length + nodeLength > maxLength) {
      truncateAt = pos + (maxLength - length);
      return false;
    }
    length += nodeLength;
    return true;
  });
  return { length, truncateAt };
}

// Deletes everything past `truncateAt`. Truncating to an exact position (rather
// than calling `undo()`) is precise regardless of typing/paste speed — `undo()`
// would revert a whole coalesced keystroke burst and land under the limit.
function truncateOverflow(editor: Editor, truncateAt: number): void {
  editor.chain().setTextSelection({ from: truncateAt, to: editor.state.doc.content.size }).deleteSelection().run();
}

/**
 * Tiptap editor for the "Nội dung" field (US001/US005): StarterKit formatting +
 * Link + "@" mentions. Owns no form state — every update is reported to the
 * parent via `onContentChange(html, isEmpty)`. Mentioned ids are not tracked
 * while typing; the parent pulls them once at submit via the imperative handle.
 */
export const KudosEditor = forwardRef<KudosEditorHandle, KudosEditorProps>(function KudosEditor(
  { onContentChange },
  ref
) {
  const t = useTranslations("KudosModal");
  const [linkDialogState, setLinkDialogState] = useState<{ range: { from: number; to: number }; text: string; url: string } | null>(
    null
  );
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, KudosLink.configure({ openOnClick: false }), createMentionExtension(t("mention.noResults"))],
    editorProps: { attributes: { class: "min-h-[160px] p-4 focus:outline-none" } },
    onUpdate: ({ editor: current }) => {
      const { length, truncateAt } = measureEditorText(current.state.doc, MAX_KUDOS_CONTENT_CHARS);
      if (truncateAt !== null) {
        truncateOverflow(current, truncateAt);
        return;
      }
      onContentChange(current.getHTML(), current.isEmpty);
      setCharCount(length);
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      getMentionedIds: () => {
        if (!editor) return [];
        const ids = new Set<string>();
        collectMentionIds(editor.getJSON(), ids);
        return Array.from(ids);
      },
    }),
    [editor]
  );

  /**
   * Opens the "Thêm đường dẫn" dialog. With a selection (or the cursor inside
   * an existing link, expanded to its full range), the Text field is pre-filled
   * from that range; with no selection, Text starts blank and Save inserts fresh
   * linked text at the cursor.
   */
  function openLinkDialog() {
    if (!editor) return;
    if (editor.state.selection.empty && editor.isActive("link")) {
      editor.chain().extendMarkRange("link").run();
    }
    const { from, to } = editor.state.selection;
    const linkHref = editor.getAttributes("link").href;
    setLinkDialogState({
      range: { from, to },
      text: editor.state.doc.textBetween(from, to, ""),
      url: typeof linkHref === "string" ? linkHref : "",
    });
  }

  function handleSaveLink(text: string, url: string) {
    if (!editor || !linkDialogState) return;
    editor
      .chain()
      .focus()
      .insertContentAt(linkDialogState.range, [{ type: "text", text, marks: [{ type: "link", attrs: { href: url } }] }])
      .run();
    setLinkDialogState(null);
  }

  const isEmpty = editor?.isEmpty ?? true;

  return (
    <div className="flex flex-1 flex-col gap-1">
      <KudosEditorToolbar editor={editor} onOpenLink={openLinkDialog} />
      <KudosEditorLinkDialog
        open={linkDialogState !== null}
        initialText={linkDialogState?.text ?? ""}
        initialUrl={linkDialogState?.url ?? ""}
        onCancel={() => setLinkDialogState(null)}
        onSave={handleSaveLink}
      />
      <div className="relative rounded-b-lg border border-details-border bg-details-text-secondary-1">
        {isEmpty && (
          <p className="pointer-events-none absolute left-4 top-4 font-montserrat text-base font-bold text-details-text-secondary-2">
            {t("contentPlaceholder")}
          </p>
        )}
        <EditorContent
          editor={editor}
          className="font-montserrat text-base text-details-text-primary-2 [&_a]:text-details-text-primary-2 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-details-border [&_blockquote]:pl-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
        />
      </div>
      <div className={`flex items-center ${charCount > 0 ? "justify-between" : "justify-center"}`}>
        <p className="font-montserrat text-base font-bold text-details-text-primary-2">{t("contentHelper")}</p>
        {charCount > 0 && (
          <p className="font-montserrat text-sm font-bold text-details-text-secondary-2">
            {t("contentCounter", { count: charCount })}
          </p>
        )}
      </div>
    </div>
  );
});
