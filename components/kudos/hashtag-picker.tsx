"use client";

import { useTranslations } from "next-intl";
import type { Hashtag } from "@/lib/kudos/types";
import { HashtagPickerRow } from "@/components/kudos/hashtag-picker-row";

type HashtagPickerProps = {
  hashtags: Hashtag[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  maxSelected: number;
};

/**
 * Presentational hashtag list for the "+ Hashtag" popover in the Write Kudos
 * modal (Phase 4). Does not fetch data and does not own open/close state —
 * the parent fetches `listHashtags()` once, owns `selectedIds`, and decides
 * when/where to mount this list (e.g. inside its own absolutely-positioned
 * popover wrapper).
 *
 * The max-N rule is evaluated here, per row, so a row only ever disables
 * when selection is at the cap AND that specific row isn't already selected.
 */
export function HashtagPicker({ hashtags, selectedIds, onToggle, maxSelected }: HashtagPickerProps) {
  const t = useTranslations("KudosModal");

  if (hashtags.length === 0) {
    return (
      <div className="w-full rounded-lg border border-details-border bg-details-container-2 p-4 text-center font-montserrat text-sm text-details-text-secondary-1">
        {t("noHashtagsAvailable")}
      </div>
    );
  }

  return (
    <ul
      role="listbox"
      aria-multiselectable="true"
      className="flex w-full flex-col items-start rounded-lg border border-details-border bg-details-container-2 p-1.5"
    >
      {hashtags.map((hashtag) => {
        const selected = selectedIds.includes(hashtag.id);
        const disabled = selectedIds.length >= maxSelected && !selected;

        return (
          <HashtagPickerRow
            key={hashtag.id}
            hashtag={hashtag}
            selected={selected}
            disabled={disabled}
            onToggle={() => onToggle(hashtag.id)}
          />
        );
      })}
    </ul>
  );
}
