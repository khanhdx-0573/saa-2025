"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { PersonIcon } from "@/components/kudos/kudos-icons";
import { IncognitoIcon } from "@/components/kudos/kudos-live-board-icons";
import { StarBadge } from "@/components/kudos/feed/star-badge";

export type KudosCardPartyProfile = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  department: string;
  starRating: 0 | 1 | 2 | 3;
};

type KudosCardPartyProps = {
  /** Real profile block. `null` only ever happens for an anonymous sender. */
  profile: KudosCardPartyProfile | null;
  /** Anonymous variant only ever applies to the sender side (recipient is always identified). */
  isAnonymous?: boolean;
  anonymousDisplayName?: string | null;
  onOpenProfile?: (profileId: string) => void;
};

/**
 * Sender/recipient block shared by both card slots. When `isAnonymous`, renders
 * an incognito placeholder — no department, no star badge, not clickable (there
 * is no profile to open). The recipient slot is always the identified variant.
 */
export function KudosCardParty({ profile, isAnonymous, anonymousDisplayName, onOpenProfile }: KudosCardPartyProps) {
  const t = useTranslations("KudosLiveBoard");

  if (isAnonymous) {
    return (
      <div className="flex w-full min-w-0 flex-col items-center gap-2 text-center sm:gap-3 lg:w-[235px]">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-details-text-secondary-1 bg-details-background text-details-text-secondary-1 sm:size-16">
          <IncognitoIcon />
        </span>
        <div className="flex flex-col items-center gap-0.5">
          <span className="break-words font-montserrat text-sm font-bold text-details-text-primary-2 sm:text-base">
            {anonymousDisplayName ?? t("party.anonymousFallbackName")}
          </span>
          <span className="break-words font-montserrat text-xs font-bold text-details-text-secondary-2 sm:text-sm">
            {t("party.anonymousSenderLabel")}
          </span>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex w-full flex-col items-center gap-2 text-center sm:gap-3 lg:w-[235px]">
      <button
        type="button"
        onClick={() => onOpenProfile?.(profile.id)}
        aria-label={profile.fullName}
        className="shrink-0"
      >
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt=""
            width={64}
            height={64}
            className="size-12 rounded-full border-2 border-details-text-secondary-1 object-cover sm:size-16"
          />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-full border-2 border-details-text-secondary-1 bg-details-textbutton-normal text-details-text-secondary-2 sm:size-16">
            <PersonIcon />
          </span>
        )}
      </button>
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={() => onOpenProfile?.(profile.id)}
          className="break-words font-montserrat text-sm font-bold text-details-text-primary-2 hover:underline sm:text-base"
        >
          {profile.fullName}
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="break-words font-montserrat text-xs font-bold text-details-text-secondary-2 sm:text-sm">
            {profile.department}
          </span>
          <StarBadge stars={profile.starRating} />
        </div>
      </div>
    </div>
  );
}
