"use client";

import { useTranslations } from "next-intl";
import { HighlightCarousel } from "@/components/kudos/feed/highlight-carousel";
import { KudosFilters } from "@/components/kudos/feed/kudos-filters";
import { useDebouncedLoading } from "@/components/kudos/feed/use-debounced-loading";
import type { KudosCardData } from "@/components/kudos/feed/kudos-card";
import type { Hashtag, KudosFilters as KudosFiltersValue } from "@/lib/kudos/types";

export type HighlightSectionProps = {
  cards: KudosCardData[];
  loading: boolean;
  filters: KudosFiltersValue;
  onFiltersChange: (next: KudosFiltersValue) => void;
  hashtags: Hashtag[];
  departments: string[];
  currentUserId: string | null;
  onLike: (kudosId: string) => void;
  onOpenDetail: (kudosId: string) => void;
  onOpenProfile: (profileId: string) => void;
};

/**
 * HIGHLIGHT KUDOS section shell: header + filter dropdowns + the ≤5-card
 * carousel, plus loading/empty states. `cards` and `filters` are owned by the
 * board shell; the same `filters` value drives `all-kudos-section.tsx` too, so
 * a change resets that feed's pagination as well (BR-09).
 */
export function HighlightSection({
  cards,
  loading,
  filters,
  onFiltersChange,
  hashtags,
  departments,
  currentUserId,
  onLike,
  onOpenDetail,
  onOpenProfile,
}: HighlightSectionProps) {
  const t = useTranslations("KudosLiveBoard");
  // Debounced so a fast filter refetch dims the carousel in place instead of
  // collapsing it to a spinner and back.
  const showSpinner = useDebouncedLoading(loading);

  const spinner = (
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-details-border border-t-details-text-primary-1" />
  );

  return (
    <section className="flex w-full flex-col gap-6" aria-label="Highlight kudos">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-36">
        <h2 className="font-montserrat text-2xl font-bold text-details-text-secondary-1">
          {t("sectionEyebrow")}
        </h2>
        <div className="h-px w-full bg-details-divider" />
        <div className="flex items-center justify-between gap-8">
          <h1 className="font-montserrat text-[57px] font-bold leading-[64px] tracking-[-0.25px] text-details-text-primary-1">
            {t("highlight.heading")}
          </h1>
          <KudosFilters value={filters} hashtags={hashtags} departments={departments} onChange={onFiltersChange} />
        </div>
      </div>

      {cards.length > 0 ? (
        <div className="relative">
          <div className={`transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>
            <HighlightCarousel
              cards={cards}
              currentUserId={currentUserId}
              onLike={onLike}
              onOpenDetail={onOpenDetail}
              onOpenProfile={onOpenProfile}
            />
          </div>
          {showSpinner && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-busy="true"
              aria-label={t("common.loading")}
            >
              {spinner}
            </div>
          )}
        </div>
      ) : showSpinner ? (
        <div className="flex items-center justify-center py-16" aria-busy="true" aria-label={t("common.loading")}>
          {spinner}
        </div>
      ) : !loading ? (
        <p className="py-16 text-center font-montserrat text-base font-bold text-details-text-secondary-2">
          {t("highlight.empty")}
        </p>
      ) : null}
    </section>
  );
}
