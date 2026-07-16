"use client";

import { useTranslations } from "next-intl";

/** Post-fallback presentational shape — `fullName` is never null here (the
 *  container already substituted `unknownUserLabel`), mirroring how
 *  `SpotlightLayoutNode` narrows `lib/kudos/types.ts`'s nullable `fullName`
 *  for the word-cloud nodes. */
export type SpotlightActivityItem = {
  kudosId: string;
  recipientId: string;
  fullName: string;
  receivedAt: string;
};

const TICKER_ROW_COUNT = 6;
/** Row 0 (bottom, most recent) is fully opaque; each row above fades further. */
const OPACITY_STEP = 0.16;
const MIN_OPACITY = 0.2;

type SpotlightActivityTickerProps = { activity: SpotlightActivityItem[] };

/**
 * Decorative "last N kudos received" feed pinned to the canvas's
 * bottom-left corner (Momorph ground truth: six stacked rows fading from
 * faint at the top to fully opaque at the bottom). This stays about
 * RECIPIENTS ("{name} đã nhận được một Kudos mới") even though the
 * word-cloud itself groups by sender — `recentActivity` is a separate,
 * per-event chronological feed (see `get_spotlight_nodes`'s
 * `recent_activity`), not derived from the sender-grouped nodes.
 */
export function SpotlightActivityTicker({ activity }: SpotlightActivityTickerProps) {
  const t = useTranslations("KudosLiveBoard");
  const recent = [...activity]
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
    .slice(0, TICKER_ROW_COUNT);

  if (recent.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-2 left-3 z-10 flex max-w-[calc(100%-24px)] flex-col-reverse gap-0.5 sm:bottom-4 sm:left-6 sm:max-w-[calc(100%-48px)] sm:gap-1"
      aria-hidden="true"
    >
      {recent.map((item, index) => (
        <p
          key={item.kudosId}
          style={{ opacity: Math.max(MIN_OPACITY, 1 - index * OPACITY_STEP) }}
          className="truncate whitespace-nowrap text-details-text-secondary-1"
        >
          {/* Momorph spec: the clock prefix and the message tail are two
             distinct type styles, not one uniform size — 14px/20px
             line-height/0.1px letter-spacing for the time, 16px/24px/0.15px
             for "{name} đã nhận được một Kudos mới" (Tailwind's `text-sm
             leading-5` and `text-base leading-6` happen to match 14/20 and
             16/24 exactly). */}
          <span className="font-montserrat text-[9px] font-bold tracking-[0.1px] sm:text-sm">
            {formatTickerTime(item.receivedAt)}
          </span>{" "}
          <span className="font-montserrat text-[10px] font-bold tracking-[0.15px] sm:text-base">
            {t("spotlight.activityNotice", { name: item.fullName })}
          </span>
        </p>
      ))}
    </div>
  );
}

/** 12-hour clock, no leading space before AM/PM (matches the design's "08:30PM"). */
function formatTickerTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours24 = date.getHours();
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = String(hours24 % 12 === 0 ? 12 : hours24 % 12).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours12}:${minutes}${period}`;
}
