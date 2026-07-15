"use client";

import { useTranslations } from "next-intl";

export type ProfileStatsProps = {
  received: number;
  sent: number;
  hearts: number;
};

export function ProfileStats({ received, sent, hearts }: ProfileStatsProps) {
  const t = useTranslations("KudosLiveBoard");
  const rows: Array<{ key: string; label: string; value: number }> = [
    { key: "received", label: t("profile.statsReceived"), value: received },
    { key: "sent", label: t("profile.statsSent"), value: sent },
    { key: "hearts", label: t("profile.statsHearts"), value: hearts },
  ];

  return (
    <dl className="flex w-full flex-col gap-3 rounded-lg border border-details-divider bg-details-container-2 p-6">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4">
          <dt className="font-montserrat text-base font-bold text-details-text-secondary-2">
            {row.label}
          </dt>
          <dd className="font-montserrat text-xl font-bold text-details-text-secondary-1">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
