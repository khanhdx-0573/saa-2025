"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FireIcon } from "@/components/kudos/kudos-live-board-icons";
import type { KudosStats } from "@/lib/kudos/types";

// Real stats rows for the D.1 sidebar card (received / sent / hearts) for the
// current user. Values arrive as props — never fetched here.
type SidebarStatsProps = {
  stats: KudosStats;
};

function StatRow({ label, value, badge }: { label: string; value: number; badge?: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <span className="flex items-center gap-1 font-montserrat text-[22px] font-bold leading-7 text-details-text-secondary-1">
        {label}
        {badge}
      </span>
      <span className="font-montserrat text-[32px] font-bold leading-10 text-details-text-primary-1">
        {value}
      </span>
    </div>
  );
}

export function SidebarStats({ stats }: SidebarStatsProps) {
  const t = useTranslations("KudosLiveBoard");

  return (
    <div className="flex w-full flex-col gap-4">
      <StatRow label={t("sidebar.received")} value={stats.received} />
      <StatRow label={t("sidebar.sent")} value={stats.sent} />
      <StatRow
        label={t("sidebar.hearts")}
        value={stats.hearts}
        // "🔥×2" badge is purely decorative per the Figma — not tied to any
        // multiplier in `KudosStats`.
        badge={
          <span className="flex items-center gap-0.5 text-base text-details-text-primary-1">
            <FireIcon />
            x2
          </span>
        }
      />
    </div>
  );
}
