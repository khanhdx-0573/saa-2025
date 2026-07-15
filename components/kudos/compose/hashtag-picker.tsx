"use client";

import { useTranslations } from "next-intl";
import type { Hashtag } from "@/lib/kudos/types";
import { HashtagPickerRow } from "@/components/kudos/compose/hashtag-picker-row";

type HashtagPickerProps = {
  hashtags: Hashtag[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  maxSelected: number;
};

// Presentational hashtag list for the "+ Hashtag" popover. The max-N cap is
// evaluated per row, so a row only disables at the cap AND when not already selected.
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
      className="scrollbar-thin flex max-h-64 w-full flex-col items-start overflow-y-auto rounded-lg border border-details-border bg-details-container-2 p-1.5"
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
