"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Hashtag } from "@/lib/kudos/types";
import { HashtagPicker } from "@/components/kudos/compose/hashtag-picker";
import { PlusIcon } from "@/components/kudos/kudos-icons";
import { MAX_HASHTAGS } from "@/lib/kudos/validation";

type HashtagFieldProps = {
  hashtags: Hashtag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
};

// "Hashtag" field: removable chips + a "+ Hashtag" trigger that opens
// <HashtagPicker> in a popover. The parent fetches the list and passes it in.
export function HashtagField({ hashtags, selectedIds, onChange }: HashtagFieldProps) {
  const t = useTranslations("KudosModal");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const selected = hashtags.filter((hashtag) => selectedIds.includes(hashtag.id));

  function toggleId(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((existing) => existing !== id) : [...selectedIds, id]);
  }

  function removeId(id: number) {
    onChange(selectedIds.filter((existing) => existing !== id));
  }

  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <label className="font-montserrat text-lg font-bold text-details-text-primary-2 sm:w-[120px] sm:shrink-0 sm:whitespace-nowrap">
        {t("hashtagLabel")}{" "}
        <span className="text-details-required-mark" aria-hidden="true">
          *
        </span>
      </label>
      <div ref={containerRef} className="relative flex flex-1 flex-wrap items-center gap-2">
        {selected.map((hashtag) => (
          <span
            key={hashtag.id}
            className="flex items-center gap-2 rounded-lg border border-details-border bg-details-text-secondary-1 py-2 pl-4 pr-2 font-montserrat text-sm font-bold text-details-text-primary-2"
          >
            {`#${hashtag.name}`}
            <button
              type="button"
              onClick={() => removeId(hashtag.id)}
              aria-label={t("hashtagRemoveAlt")}
              className="text-details-text-primary-2"
            >
              &times;
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg border border-details-border bg-details-text-secondary-1 px-2 py-1 hover:bg-details-textbutton-normal"
        >
          <PlusIcon className="text-details-text-secondary-2" />
          <span className="flex flex-col items-start leading-tight">
            <span className="font-montserrat text-xs font-bold tracking-wide text-details-text-primary-2">
              {t("addHashtagButton")}
            </span>
            <span className="font-montserrat text-xs font-bold tracking-wide text-details-text-secondary-2">
              {selectedIds.length >= MAX_HASHTAGS ? t("hashtagMaxReached") : t("hashtagMaxHint")}
            </span>
          </span>
        </button>
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 animate-[fadeSlideIn_200ms_ease-out] sm:left-0 sm:right-auto sm:w-64">
            <HashtagPicker
              hashtags={hashtags}
              selectedIds={selectedIds}
              onToggle={toggleId}
              maxSelected={MAX_HASHTAGS}
            />
          </div>
        )}
      </div>
    </div>
  );
}
