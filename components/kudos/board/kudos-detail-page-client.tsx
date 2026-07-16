"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { KudosCard } from "@/components/kudos/feed/kudos-card";
import { KudosEditModal } from "@/components/kudos/compose/kudos-edit-modal";
import { ChevronLeftIcon } from "@/components/kudos/kudos-live-board-icons";
import { buildKudosDetailUrl, isSelfKudos, mapKudosCardToCardData } from "@/lib/kudos/queries-mappers";
import { toggleKudosLike } from "@/lib/kudos/mutations";
import type { KudosCard as KudosCardModel } from "@/lib/kudos/types";

type KudosDetailPageClientProps = {
  card: KudosCardModel;
};

function flipLike(card: KudosCardModel, kudosId: string): KudosCardModel {
  if (card.id !== kudosId) return card;
  return {
    ...card,
    likedByMe: !card.likedByMe,
    heartCount: card.heartCount + (card.likedByMe ? -1 : 1),
  };
}

// Detail route shell. Renders KudosCard at full fidelity with
// `truncateContent={false}` — no "..." clamp here (unlike Highlight/All Kudos).
// Owns the optimistic like mutation, reconciled with the RPC and reverted on error.
export function KudosDetailPageClient({ card: initialCard }: KudosDetailPageClientProps) {
  const t = useTranslations("KudosLiveBoard");
  const router = useRouter();
  const { user } = useAuth();
  const [card, setCard] = useState(initialCard);
  const [isEditing, setIsEditing] = useState(false);

  const cardData = useMemo(
    () => mapKudosCardToCardData(card, { unknownUserLabel: t("card.unknownUser") }),
    [card, t]
  );
  const detailUrl = useMemo(() => buildKudosDetailUrl(card.id), [card.id]);
  // One condition, two uses: you can't like your own kudos, and only the sender can edit it.
  const isOwnKudos = isSelfKudos(card, user?.id ?? null);

  const handleLike = useCallback((kudosId: string) => {
    setCard((prev) => flipLike(prev, kudosId));
    toggleKudosLike(kudosId)
      .then(({ liked, heartCount }) => {
        setCard((prev) => (prev.id === kudosId ? { ...prev, likedByMe: liked, heartCount } : prev));
      })
      .catch(() => {
        // Revert the optimistic flip on failure.
        setCard((prev) => flipLike(prev, kudosId));
      });
  }, []);

  const handleOpenProfile = useCallback((profileId: string) => router.push(`/profile/${profileId}`), [router]);

  // No-op: already on the detail view, nowhere further to navigate.
  const handleOpenDetail = useCallback(() => {}, []);

  return (
    <div className="w-full max-w-2xl">
      <Link
        href="/kudos"
        aria-label={t("detail.backAriaLabel")}
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-details-textbutton-normal text-details-text-secondary-1"
      >
        <ChevronLeftIcon />
      </Link>
      <KudosCard
        card={cardData}
        contentLines={5}
        showImages
        truncateContent={false}
        heartDisabled={isOwnKudos}
        canEdit={isOwnKudos}
        detailUrl={detailUrl}
        onLike={handleLike}
        onOpenDetail={handleOpenDetail}
        onOpenProfile={handleOpenProfile}
        onEdit={() => setIsEditing(true)}
      />
      <KudosEditModal
        kudosId={isEditing ? card.id : null}
        onClose={() => setIsEditing(false)}
        onSaved={(updated) => setCard(updated)}
      />
    </div>
  );
}
