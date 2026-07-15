"use client";

import { useTranslations } from "next-intl";
import { StarIcon } from "@/components/kudos/kudos-live-board-icons";

type StarBadgeProps = {
  stars: 0 | 1 | 2 | 3;
};

/**
 * Star-rating badge: 0-3 filled stars (computed upstream from received-kudos
 * count: 1★ ≥10, 2★ ≥20, 3★ ≥50), nothing when `stars === 0`. The threshold
 * tooltip uses a pure-CSS `group-hover` pair so this stays a hook-free leaf.
 */
export function StarBadge({ stars }: StarBadgeProps) {
  const t = useTranslations("KudosLiveBoard");
  if (stars === 0) return null;

  const thresholdLabel: Record<1 | 2 | 3, string> = {
    1: t("star.threshold1"),
    2: t("star.threshold2"),
    3: t("star.threshold3"),
  };

  return (
    <span className="group relative inline-flex items-center gap-0.5" tabIndex={0}>
      {Array.from({ length: stars }, (_, index) => (
        <StarIcon key={index} className="text-details-text-primary-1" />
      ))}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-details-background px-3 py-2 text-center font-montserrat text-xs font-bold text-details-text-secondary-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {thresholdLabel[stars]}
      </span>
    </span>
  );
}
