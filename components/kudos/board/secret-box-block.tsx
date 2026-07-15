"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Secret Box block (Figma D.1.6-8): mock, display-only — the feature doesn't
// exist yet. "Mở Secret Box" only reveals a "coming soon" state.
const MOCK_SECRET_BOX_OPENED = 5;
const MOCK_SECRET_BOX_UNOPENED = 3;

function GiftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 8H17.83C17.94 7.68 18 7.34 18 7C18 5.34 16.66 4 15 4C13.95 4 13.03 4.54 12.48 5.36L12 6.02L11.52 5.35C10.97 4.54 10.05 4 9 4C7.34 4 6 5.34 6 7C6 7.34 6.06 7.68 6.17 8H4C2.9 8 2.01 8.9 2.01 10V12C2.01 12.55 2.46 13 3.01 13H4V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V13H21C21.55 13 22 12.55 22 12V10C22 8.9 21.1 8 20 8ZM15 6C15.55 6 16 6.45 16 7C16 7.55 15.55 8 15 8C14.45 8 14 7.55 14 7C14 6.45 14.45 6 15 6ZM9 6C9.55 6 10 6.45 10 7C10 7.55 9.55 8 9 8C8.45 8 8 7.55 8 7C8 6.45 8.45 6 9 6ZM4 10H11V12H4V10ZM6 19V13H11V19H6ZM18 19H13V13H18V19ZM20 12H13V10H20V12Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SecretBoxBlock() {
  const t = useTranslations("KudosLiveBoard");
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between gap-2">
        <span className="font-montserrat text-[22px] font-bold leading-7 text-details-text-secondary-1">
          {t("sidebar.secretBoxOpened")}
        </span>
        <span className="font-montserrat text-[32px] font-bold leading-10 text-details-text-primary-1">
          {MOCK_SECRET_BOX_OPENED}
        </span>
      </div>
      <div className="flex w-full items-center justify-between gap-2">
        <span className="font-montserrat text-[22px] font-bold leading-7 text-details-text-secondary-1">
          {t("sidebar.secretBoxUnopened")}
        </span>
        <span className="font-montserrat text-[32px] font-bold leading-10 text-details-text-primary-1">
          {MOCK_SECRET_BOX_UNOPENED}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setShowComingSoon(true)}
        disabled={showComingSoon}
        className="flex w-full items-center justify-center gap-1 rounded-lg bg-details-text-primary-1 px-4 py-4 text-details-text-primary-2 disabled:opacity-70"
      >
        <span className="font-montserrat text-[22px] font-bold leading-7 text-details-text-primary-2">
          {showComingSoon ? t("sidebar.comingSoon") : t("sidebar.openSecretBox")}
        </span>
        <GiftIcon />
      </button>
    </div>
  );
}
