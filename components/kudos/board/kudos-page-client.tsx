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

        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-10 px-4 sm:px-6 lg:flex-row lg:justify-between lg:px-36">
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
          {/* `lg:pt-[169px]` = AllKudosSection's header block height, so the
             sidebar lines up with the first card, not the "ALL KUDOS" heading. */}
          <div className="w-full lg:w-[422px] lg:shrink-0 lg:pt-[169px]">
            <KudosSidebar stats={stats} />
          </div>
        </div>
      </div>
    </div>
  );
}
