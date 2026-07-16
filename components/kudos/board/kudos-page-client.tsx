"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { HighlightSection } from "@/components/kudos/feed/highlight-section";
import { SpotlightBoard } from "@/components/kudos/spotlight/spotlight-board";
import { AllKudosSection } from "@/components/kudos/feed/all-kudos-section";
import { KudosSidebar } from "@/components/kudos/board/kudos-sidebar";
import { useKudosBoard } from "@/components/kudos/board/use-kudos-board";

// Kudos Live Board shell: composes the board sections. Board-level data lives
// in `use-kudos-board.ts`; this file stays focused on layout and navigation.
export function KudosPageClient() {
  const t = useTranslations("KudosLiveBoard");
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const unknownUserLabel = t("card.unknownUser");

  const {
    filters,
    setFilters,
    hashtags,
    departments,
    highlightCards,
    highlightLoading,
    spotlightData,
    spotlightLoading,
    stats,
    handleHighlightLike,
    fetchAllKudosPage,
  } = useKudosBoard(currentUserId, unknownUserLabel);

  const handleOpenProfile = useCallback((profileId: string) => router.push(`/profile/${profileId}`), [router]);
  const handleOpenDetail = useCallback((kudosId: string) => router.push(`/kudos/${kudosId}`), [router]);

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full flex-col gap-16 py-16">
        <HighlightSection
          cards={highlightCards}
          loading={highlightLoading}
          filters={filters}
          onFiltersChange={setFilters}
          hashtags={hashtags}
          departments={departments}
          currentUserId={currentUserId}
          onLike={handleHighlightLike}
          onOpenDetail={handleOpenDetail}
          onOpenProfile={handleOpenProfile}
        />

        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-36">
          <SpotlightBoard data={spotlightData} loading={spotlightLoading} onOpenDetail={handleOpenDetail} />
        </div>

        {/* fix-bug: the two-column split used to switch on at `lg:` (1024px)
           — exactly iPad Pro 12.9"'s portrait width. At 1024px, `lg:px-36`'s
           144px side gutters plus the sidebar's fixed 422px left only ~274px
           for the card column, forcing it back into cramped mobile-style
           rendering (3-line name wraps, mobile padding). Deferred to `xl:`
           (1280px) — comfortably wide enough for both — so 1024-1279px stays
           single-column (full-width card, sidebar stacked below), same as
           narrower tablet/mobile already render. */}
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 sm:px-6 lg:px-36 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <AllKudosSection
              filters={filters}
              currentUserId={currentUserId}
              unknownUserLabel={unknownUserLabel}
              onOpenDetail={handleOpenDetail}
              onOpenProfile={handleOpenProfile}
              fetchPage={fetchAllKudosPage}
            />
          </div>
          {/* `xl:pt-[169px]` = AllKudosSection's header block height, so the
             sidebar lines up with the first card, not the "ALL KUDOS" heading. */}
          <div className="w-full xl:w-[422px] xl:shrink-0 xl:pt-[169px]">
            <KudosSidebar stats={stats} />
          </div>
        </div>
      </div>
    </div>
  );
}
