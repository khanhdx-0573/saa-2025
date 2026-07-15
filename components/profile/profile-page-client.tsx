"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileStats } from "@/components/profile/profile-stats";
import { StarBadge } from "@/components/kudos/feed/star-badge";

export type ProfileDetail = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  department: string;
  starRating: 0 | 1 | 2 | 3;
  stats: {
    received: number;
    sent: number;
    hearts: number;
  };
};

type ProfilePageClientProps = {
  profile: ProfileDetail;
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfilePageClient({ profile }: ProfilePageClientProps) {
  const t = useTranslations("KudosLiveBoard");
  const { user } = useAuth();
  const isCurrentUser = user?.id === profile.id;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 px-6 py-16">
      {profile.avatarUrl ? (
        <Image
          src={profile.avatarUrl}
          alt={profile.fullName}
          width={120}
          height={120}
          className="size-[120px] shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-[120px] shrink-0 items-center justify-center rounded-full bg-details-textbutton-normal font-montserrat text-4xl font-bold text-details-text-secondary-1"
        >
          {getInitials(profile.fullName)}
        </span>
      )}

      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-2">
          <h1 className="font-montserrat text-2xl font-bold text-details-text-secondary-1">
            {profile.fullName}
          </h1>
          {isCurrentUser && (
            <span className="rounded-full bg-details-text-primary-1 px-2 py-0.5 font-montserrat text-xs font-bold text-details-text-primary-2">
              {t("profile.currentUserBadge")}
            </span>
          )}
        </div>
        <p className="font-montserrat text-base font-bold text-details-text-secondary-2">
          {profile.department}
        </p>
      </div>

      <StarBadge stars={profile.starRating} />

      <ProfileStats
        received={profile.stats.received}
        sent={profile.stats.sent}
        hearts={profile.stats.hearts}
      />
    </div>
  );
}
