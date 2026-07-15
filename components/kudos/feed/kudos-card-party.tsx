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
      <div className="flex w-full flex-col items-center gap-3 text-center lg:w-[235px]">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-details-text-secondary-1 bg-details-background text-details-text-secondary-1">
          <IncognitoIcon />
        </span>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-montserrat text-base font-bold text-details-text-primary-2">
            {anonymousDisplayName ?? t("party.anonymousFallbackName")}
          </span>
          <span className="font-montserrat text-sm font-bold text-details-text-secondary-2">
            {t("party.anonymousSenderLabel")}
          </span>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex w-full flex-col items-center gap-3 text-center lg:w-[235px]">
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
            className="size-16 rounded-full border-2 border-details-text-secondary-1 object-cover"
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full border-2 border-details-text-secondary-1 bg-details-textbutton-normal text-details-text-secondary-2">
            <PersonIcon />
          </span>
        )}
      </button>
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={() => onOpenProfile?.(profile.id)}
          className="font-montserrat text-base font-bold text-details-text-primary-2 hover:underline"
        >
          {profile.fullName}
        </button>
        <div className="flex items-center gap-2">
          <span className="font-montserrat text-sm font-bold text-details-text-secondary-2">
            {profile.department}
          </span>
          <StarBadge stars={profile.starRating} />
        </div>
      </div>
    </div>
  );
}
