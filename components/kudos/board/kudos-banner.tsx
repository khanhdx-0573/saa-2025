"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ComposeEntryBar } from "@/components/kudos/board/compose-entry-bar";
import { SunnerSearchBar } from "@/components/kudos/board/sunner-search-bar";

// Hero banner (MoMorph A, 2940:13437). The background KV image lives in
// app/kudos/page.tsx; this only reserves its aspect-[1440/512] space (the
// asset's natural proportions) and renders content on top.
export function KudosBanner() {
  const t = useTranslations("KudosLiveBoard");

  return (
    <div className="relative flex w-full items-center justify-center aspect-[4/3] sm:aspect-[16/9] lg:aspect-[1440/512]">
      {/* `items-start` is load-bearing: flex's default `stretch` would force
         the wordmark <img> to full width via object-fit: fill, smearing it. */}
      <div className="relative z-10 flex h-full w-full max-w-[1440px] flex-col justify-between px-4 py-6 sm:px-6 sm:py-8 lg:px-36 lg:py-12">
        <div className="flex flex-col items-start gap-2 sm:gap-2.5">
          <h1 className="font-montserrat text-xl font-bold leading-tight text-details-text-primary-1 sm:text-2xl lg:text-[36px] lg:leading-[44px]">
            {t("banner.title")}
          </h1>
          <Image
            src="/kudos/kudos-wordmark.svg"
            alt="SAA 2025 KUDOS"
            width={593}
            height={106}
            className="h-[48px] w-auto sm:h-[72px] lg:h-[104px]"
          />
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0 flex-1">
            <ComposeEntryBar />
          </div>
          <SunnerSearchBar />
        </div>
      </div>
    </div>
  );
}
