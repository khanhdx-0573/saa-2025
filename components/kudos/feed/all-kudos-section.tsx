"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { KudosCard } from "@/components/kudos/feed/kudos-card";
import { KudosEditModal } from "@/components/kudos/compose/kudos-edit-modal";
import { useKudosFeed, type FetchKudosPage } from "@/components/kudos/feed/use-kudos-feed";
import { useDebouncedLoading } from "@/components/kudos/feed/use-debounced-loading";
import { buildKudosDetailUrl, mapKudosCardToCardData } from "@/lib/kudos/queries-mappers";
import type { KudosFilters } from "@/lib/kudos/types";

/** Product decision (deviates from the spec's infinite scroll): cap the feed
 *  at the 5 most recent kudos so the page never grows long. */
const ALL_KUDOS_DISPLAY_LIMIT = 5;

type AllKudosSectionProps = {
  filters: KudosFilters;
  /** BR-04: disables the heart toggle on a card whose sender is the current
   *  viewer. `null` means "no signed-in user" (never disabled). */
  currentUserId: string | null;
  /** Fallback shown when a party's `full_name` is `null`. */
  unknownUserLabel: string;
  onOpenDetail: (kudosId: string) => void;
  onOpenProfile: (profileId: string) => void;
  fetchPage?: FetchKudosPage;
};

/**
 * ALL KUDOS section: the most recent kudos the viewer SENT — the fetcher is
 * scoped to `currentUserId`, so every card here is one the viewer can edit.
 * Owns the `cards` array, so the like toggle and the edit modal both live here
 * to patch it in place.
 */
export function AllKudosSection({
  filters,
  currentUserId,
  unknownUserLabel,
  onOpenDetail,
  onOpenProfile,
  fetchPage,
}: AllKudosSectionProps) {
  const t = useTranslations("KudosLiveBoard");
  const { cards, loading, toggleLike, updateCard } = useKudosFeed({
    filters,
    fetchPage,
    pageSize: ALL_KUDOS_DISPLAY_LIMIT,
  });
  const [editingKudosId, setEditingKudosId] = useState<string | null>(null);

  const isEmpty = !loading && cards.length === 0;
  // Debounced so a fast filter refetch dims the cards instead of flashing a
  // spinner over a collapsed layout.
  const showSpinner = useDebouncedLoading(loading);

  return (
    <section className="flex w-full flex-col gap-10" aria-label="All kudos feed">
      <div className="flex w-full flex-col gap-4">
        <h2 className="font-montserrat text-2xl font-bold text-details-text-secondary-1">{t("sectionEyebrow")}</h2>
        <div className="h-px w-full bg-details-divider" />
        <h3 className="font-montserrat text-3xl font-bold text-details-text-primary-1 lg:text-[57px] lg:leading-[64px] lg:tracking-[-0.25px]">
          {t("allKudos.heading")}
        </h3>
      </div>

      <div className="flex w-full max-w-[680px] flex-col gap-6">
        {isEmpty ? (
          <p className="py-10 text-center font-montserrat text-base text-details-text-secondary-2">
            {t("allKudos.empty")}
          </p>
        ) : (
          <div className={`flex flex-col gap-6 transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>
            {cards.map((card) => (
              <KudosCard
                key={card.id}
                card={card}
                contentLines={5}
                showImages
                heartDisabled={card.sender?.id === currentUserId}
                canEdit={card.sender?.id === currentUserId}
                detailUrl={buildKudosDetailUrl(card.id)}
                onLike={toggleLike}
                onOpenDetail={onOpenDetail}
                onOpenProfile={onOpenProfile}
                onEdit={setEditingKudosId}
              />
            ))}
          </div>
        )}

        {showSpinner && (
          <div className="flex items-center justify-center py-6" aria-busy="true" aria-label={t("common.loading")}>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-details-border border-t-details-text-primary-1" />
          </div>
        )}
      </div>

      <KudosEditModal
        kudosId={editingKudosId}
        onClose={() => setEditingKudosId(null)}
        onSaved={(updated) => updateCard(updated.id, mapKudosCardToCardData(updated, { unknownUserLabel }))}
      />
    </section>
  );
}
