"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { searchProfiles } from "@/lib/kudos/queries";

type MentionItem = { id: string; label: string };

const MAX_MENTION_RESULTS = 5;

/**
 * Configured `Mention` extension for the "@" inline-mention feature
 * (US005). Suggestion positioning/popup is hand-rolled with `ReactRenderer`
 * and the suggestion plugin's `clientRect` — no extra positioning library
 * (e.g. tippy) is installed, per the "no new deps beyond the 4 Tiptap
 * packages" constraint.
 *
 * `noResultsLabel` is passed in (rather than read via `useTranslations`
 * inside `MentionList`) because Tiptap's `ReactRenderer` mounts the popup in
 * a detached React root outside `NextIntlClientProvider` — context would
 * not flow through, so the caller (which does render inside the provider)
 * resolves the string first.
 */
export function createMentionExtension(noResultsLabel: string) {
  return Mention.configure({
    HTMLAttributes: { class: "kudos-mention" },
    suggestion: {
      items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
        const profiles = await searchProfiles(query);
        return profiles.slice(0, MAX_MENTION_RESULTS).map((profile) => ({
          id: profile.id,
          label: profile.full_name ?? profile.id,
        }));
      },
      render: () => {
        let component: ReactRenderer<MentionListRef, MentionListProps> | null = null;
        let popup: HTMLDivElement | null = null;

        function positionPopup(props: SuggestionProps<MentionItem>) {
          const rect = props.clientRect?.();
          if (!rect || !popup) return;
          popup.style.left = `${rect.left}px`;
          popup.style.top = `${rect.bottom + 4}px`;
        }

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionList, {
              props: { items: props.items, command: props.command, noResultsLabel },
              editor: props.editor,
            });
            popup = document.createElement("div");
            popup.style.position = "fixed";
            popup.style.zIndex = "9999";
            popup.appendChild(component.element);
            document.body.appendChild(popup);
            positionPopup(props);
          },
          onUpdate: (props) => {
            component?.updateProps({ items: props.items, command: props.command, noResultsLabel });
            positionPopup(props);
          },
          onKeyDown: (props: SuggestionKeyDownProps) => {
            if (props.event.key === "Escape") {
              popup?.remove();
              return true;
            }
            return component?.ref?.onKeyDown(props) ?? false;
          },
          onExit: () => {
            popup?.remove();
            popup = null;
            component?.destroy();
            component = null;
          },
        };
      },
    },
  });
}

type MentionListProps = {
  items: MentionItem[];
  command: (item: MentionItem) => void;
  noResultsLabel: string;
};

type MentionListRef = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

const MentionList = forwardRef<MentionListRef, MentionListProps>(function MentionList(
  { items, command, noResultsLabel },
  ref
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "Enter") {
        const item = items[selectedIndex];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-details-border bg-details-text-secondary-1 p-3 font-montserrat text-sm text-details-text-secondary-2 shadow-lg">
        {noResultsLabel}
      </div>
    );
  }

  return (
    <ul
      role="listbox"
      className="max-h-64 w-56 overflow-y-auto rounded-lg border border-details-border bg-details-text-secondary-1 p-1.5 shadow-lg"
    >
      {items.map((item, index) => (
        <li key={item.id} role="option" aria-selected={index === selectedIndex}>
          <button
            type="button"
            onClick={() => command(item)}
            className={`w-full rounded-xs px-4 py-2 text-left font-montserrat text-sm font-bold text-details-text-primary-2 ${
              index === selectedIndex ? "bg-details-textbutton-normal" : ""
            }`}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
});
