"use client";

import { type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { BoldIcon, ItalicIcon, LinkIcon, ListIcon, QuoteIcon, StrikeIcon } from "@/components/kudos/kudos-icons";

type FormatAction = {
  key: "bold" | "italic" | "strike" | "orderedList" | "quote";
  isActiveName: string;
  glyph: ReactNode;
  run: (editor: Editor) => void;
};

const FORMAT_ACTIONS: FormatAction[] = [
  {
    key: "bold",
    isActiveName: "bold",
    glyph: <BoldIcon />,
    run: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    key: "italic",
    isActiveName: "italic",
    glyph: <ItalicIcon />,
    run: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    key: "strike",
    isActiveName: "strike",
    glyph: <StrikeIcon />,
    run: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    key: "orderedList",
    isActiveName: "orderedList",
    glyph: <ListIcon />,
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    key: "quote",
    isActiveName: "blockquote",
    glyph: <QuoteIcon />,
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
];

type KudosEditorToolbarProps = {
  editor: Editor | null;
  onOpenLink: () => void;
};

/** Formatting toolbar for the Kudos editor: StarterKit toggles + a link button. */
export function KudosEditorToolbar({ editor, onOpenLink }: KudosEditorToolbarProps) {
  const t = useTranslations("KudosModal");

  return (
    <div className="flex flex-wrap items-center divide-x divide-details-border rounded-t-lg border border-b-0 border-details-border">
      {FORMAT_ACTIONS.map((action) => (
        <ToolbarButton
          key={action.key}
          label={t(`toolbar.${action.key}`)}
          active={editor?.isActive(action.isActiveName) ?? false}
          onClick={() => editor && action.run(editor)}
        >
          {action.glyph}
        </ToolbarButton>
      ))}
      <ToolbarButton label={t("toolbar.link")} active={editor?.isActive("link") ?? false} onClick={onOpenLink}>
        <LinkIcon />
      </ToolbarButton>
      <span className="flex h-9 items-center whitespace-nowrap px-2.5 font-montserrat text-xs font-bold text-details-community-link underline">
        {t("communityStandards")}
      </span>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-9 items-center justify-center px-2.5 font-montserrat text-sm text-details-text-primary-2 ${
        active ? "bg-details-textbutton-normal" : "hover:bg-details-textbutton-normal"
      }`}
    >
      {children}
    </button>
  );
}
