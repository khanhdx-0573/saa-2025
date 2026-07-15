"use client";

import { useTranslations } from "next-intl";
import type { PositionedSpotlightNode } from "./spotlight-layout";

/**
 * Small presentational pieces used by `spotlight-board.tsx` — split out to
 * keep that file under the project's ~200-line guidance. No exports here
 * carry any state or data-fetching of their own.
 */

type SpotlightControlsProps = { expanded: boolean; onToggleExpand: () => void };

/**
 * Fullscreen toggle, floating bare (no pill/border chrome) in the canvas's
 * bottom-right corner — Momorph ground truth (node B.7.2, `3007:17479`) is a
 * single diagonal expand glyph. Expands the whole canvas to fill the
 * viewport (`spotlight-board.tsx` owns the `expanded` state + Escape-to-exit)
 * — the same glyph rotates 180° to read as "collapse" once expanded, rather
 * than swapping in a second bespoke icon the design doesn't define.
 *
 * fix-bug: the icon alone is a ~20px hit target — `p-3` pads that out to a
 * proper touch target without adding back the pill/border chrome the design
 * doesn't have. fix-bug: pulled the anchor in from `bottom-2 right-2` to
 * `bottom-4 right-4` — the canvas has a 47px `border-radius` +
 * `overflow-hidden`, and an 8px inset left this button's own corner sitting
 * inside that rounded cut-off, clipping part of its hit area away (reported
 * as "can't click").
 */
export function SpotlightControls({ expanded, onToggleExpand }: SpotlightControlsProps) {
  const t = useTranslations("KudosLiveBoard");
  const label = expanded ? t("spotlight.collapseView") : t("spotlight.expandView");

  return (
    <button
      type="button"
      onClick={onToggleExpand}
      aria-label={label}
      title={label}
      className="absolute bottom-4 right-4 z-10 p-3 text-details-text-secondary-1 opacity-90 transition-opacity hover:opacity-100"
    >
      <ExpandIcon className={expanded ? "rotate-180" : undefined} />
    </button>
  );
}

type SpotlightTooltipProps = {
  node: PositionedSpotlightNode;
  left: number;
  top: number;
};

export function SpotlightTooltip({ node, left, top }: SpotlightTooltipProps) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 max-w-[220px] rounded-lg border border-details-border bg-details-container-2 px-3 py-2 text-xs text-details-text-secondary-1 shadow-lg"
      style={{ left, top }}
    >
      <p className="font-montserrat font-bold">{node.fullName}</p>
      <p className="font-montserrat text-details-text-secondary-2">{formatLastSent(node.lastSentAt)}</p>
    </div>
  );
}

/** Matches the project's card timestamp convention (FR-006): "HH:mm - MM/DD/YYYY". */
function formatLastSent(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${hh}:${mm} - ${mo}/${dd}/${date.getFullYear()}`;
}

export function SpotlightSkeleton() {
  const t = useTranslations("KudosLiveBoard");

  return (
    <div
      className="flex h-full w-full animate-pulse items-center justify-center gap-3"
      aria-busy="true"
      aria-label={t("common.loading")}
    >
      <div className="h-3 w-24 rounded-full bg-details-divider" />
      <div className="h-4 w-32 rounded-full bg-details-divider" />
      <div className="h-2 w-16 rounded-full bg-details-divider" />
    </div>
  );
}

export function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-details-text-secondary-2">
      <path
        d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Diagonal expand glyph — Momorph node B.7.2 (`3007:17479`): two arrows pointing away from center, top-right and bottom-left. */
function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M14.5 3h6.5v6.5M9.5 21H3v-6.5M20.5 3.5 13 11M3.5 20.5 11 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
