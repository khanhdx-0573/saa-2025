"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { KudosCard, type KudosCardData } from "@/components/kudos/feed/kudos-card";
import { ChevronRightIcon } from "@/components/kudos/kudos-live-board-icons";
import { buildKudosDetailUrl } from "@/lib/kudos/queries-mappers";

export type HighlightCarouselProps = {
  cards: KudosCardData[];
  /** BR-04: disables the heart toggle on the active card when its sender is
   *  the current viewer. `null` means "no signed-in user" (never disabled). */
  currentUserId: string | null;
  onLike: (kudosId: string) => void;
  onOpenDetail: (kudosId: string) => void;
  onOpenProfile: (profileId: string) => void;
};

const MAX_CARDS = 5;
// Desktop-only pixel constants — mobile uses CSS-based layout instead.
const CARD_WIDTH_PX = 528;
const CARD_GAP_PX = 24; // gap-6
const VIEWPORT_WIDTH_PX = 1440;
const EDGE_FADE_WIDTH_PX = 400;
// Matches Tailwind's `lg` breakpoint — below this, single-card mode activates.
const MOBILE_BREAKPOINT_PX = 1024;

const NOOP = () => {};

/**
 * ≤5-card highlight carousel: desktop renders a sliding row (animated
 * `translateX`) with edge fades; mobile renders a single full-width card
 * with prev/next navigation — no JS pixel math on small viewports.
 */
export function HighlightCarousel({
  cards,
  currentUserId,
  onLike,
  onOpenDetail,
  onOpenProfile,
}: HighlightCarouselProps) {
  const t = useTranslations("KudosLiveBoard");
  const limitedCards = cards.slice(0, MAX_CARDS);
  // Default to the 2nd card so the carousel opens with a peek card on both
  // sides instead of an empty left edge (unless there's only one card).
  const [activeIndex, setActiveIndex] = useState(() => (limitedCards.length > 1 ? 1 : 0));
  const total = limitedCards.length;

  // Responsive: track viewport width to switch between desktop carousel and
  // mobile single-card mode. `useSyncExternalStore`-style via state + effect.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Touch swipe support for mobile single-card mode
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = event.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(diff) < 50) return; // ignore small swipes
      if (diff > 0) setActiveIndex((i) => Math.max(0, i - 1));
      else setActiveIndex((i) => Math.min(total - 1, i + 1));
    },
    [total],
  );

  if (total === 0) return null;

  const clampedIndex = Math.min(activeIndex, total - 1);
  const isFirst = clampedIndex === 0;
  const isLast = clampedIndex === total - 1;

  function goPrev() {
    setActiveIndex((current) => Math.max(0, current - 1));
  }

  function goNext() {
    setActiveIndex((current) => Math.min(total - 1, current + 1));
  }

  // Desktop: centering in pixels — `%` would resolve against the row's own
  // dynamic width rather than the fixed viewport.
  const rowOffsetPx = (VIEWPORT_WIDTH_PX - CARD_WIDTH_PX) / 2 - clampedIndex * (CARD_WIDTH_PX + CARD_GAP_PX);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-6">
      {isMobile ? (
        /* ── Mobile: single full-width card with swipe ── */
        <div
          className="relative w-full overflow-hidden px-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {limitedCards.map((card, index) => {
            const isActive = index === clampedIndex;
            return (
              <div
                key={card.id}
                className={isActive ? "block" : "hidden"}
                aria-hidden={!isActive}
                aria-label={
                  isActive ? t("highlight.positionAriaLabel", { current: clampedIndex + 1, total }) : undefined
                }
              >
                <KudosCard
                  card={card}
                  contentLines={3}
                  showImages={false}
                  heartDisabled={isActive ? card.sender?.id === currentUserId : true}
                  detailUrl={buildKudosDetailUrl(card.id)}
                  onLike={isActive ? onLike : NOOP}
                  onOpenDetail={isActive ? onOpenDetail : NOOP}
                  onOpenProfile={isActive ? onOpenProfile : NOOP}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Desktop: sliding row with edge fades ── */
        <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden">
          <div
            className="flex items-center gap-6 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(${rowOffsetPx}px)` }}
          >
            {limitedCards.map((card, index) => {
              const isActive = index === clampedIndex;
              return (
                <div
                  key={card.id}
                  className="w-[528px] shrink-0"
                  aria-hidden={!isActive}
                  aria-label={
                    isActive ? t("highlight.positionAriaLabel", { current: clampedIndex + 1, total }) : undefined
                  }
                >
                  <div className={isActive ? undefined : "pointer-events-none"}>
                    <KudosCard
                      card={card}
                      contentLines={3}
                      showImages={false}
                      heartDisabled={isActive ? card.sender?.id === currentUserId : true}
                      detailUrl={buildKudosDetailUrl(card.id)}
                      onLike={isActive ? onLike : NOOP}
                      onOpenDetail={isActive ? onOpenDetail : NOOP}
                      onOpenProfile={isActive ? onOpenProfile : NOOP}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edge fades: blend the clipped peek-card slivers into the page
             background instead of a hard clip line. */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0"
            style={{ width: EDGE_FADE_WIDTH_PX, background: "linear-gradient(90deg, var(--details-background) 50%, transparent 100%)" }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0"
            style={{ width: EDGE_FADE_WIDTH_PX, background: "linear-gradient(270deg, var(--details-background) 50%, transparent 100%)" }}
          />
        </div>
      )}

      <div className="flex items-center gap-8">
        <button
          type="button"
          onClick={goPrev}
          disabled={isFirst}
          aria-label={t("highlight.prevAriaLabel")}
          className="flex size-12 items-center justify-center rounded text-details-text-secondary-2 hover:bg-details-textbutton-normal disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRightIcon className="rotate-180" />
        </button>
        <span className="font-montserrat text-2xl font-bold leading-9 text-details-text-secondary-2">
          {clampedIndex + 1}/{total}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={isLast}
          aria-label={t("highlight.nextAriaLabel")}
          className="flex size-12 items-center justify-center rounded text-details-text-secondary-2 hover:bg-details-textbutton-normal disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
