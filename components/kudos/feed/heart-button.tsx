"use client";

import { useTranslations } from "next-intl";
import { HeartFilledIcon, HeartOutlineIcon } from "@/components/kudos/kudos-live-board-icons";

type HeartButtonProps = {
  count: number;
  liked: boolean;
  disabled: boolean;
  onToggle: () => void;
};

/** Purely controlled heart/like toggle. When `disabled` (the "own kudos" case)
 *  it renders non-interactive rather than hidden, so the count stays visible. */
export function HeartButton({ count, liked, disabled, onToggle }: HeartButtonProps) {
  const t = useTranslations("KudosLiveBoard");
  const colorClass = liked ? "text-details-error" : "text-details-text-secondary-2";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={liked}
      aria-label={liked ? t("heart.unlike") : t("heart.like")}
      onClick={onToggle}
      className={`flex items-center gap-1 font-montserrat text-lg font-bold leading-7 text-details-text-primary-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-2xl sm:leading-8 ${
        disabled ? "" : "cursor-pointer"
      }`}
    >
      <span>{count}</span>
      <span className={colorClass}>{liked ? <HeartFilledIcon /> : <HeartOutlineIcon />}</span>
    </button>
  );
}
