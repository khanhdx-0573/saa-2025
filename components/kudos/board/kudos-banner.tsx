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
    <div className="relative flex w-full items-center justify-center aspect-[1440/512]">
      {/* `items-start` is load-bearing: flex's default `stretch` would force
         the wordmark <img> to full width via object-fit: fill, smearing it. */}
      <div className="relative z-10 flex h-full w-full max-w-[1440px] flex-col justify-between px-36 py-12">
        <div className="flex flex-col items-start gap-2.5">
          <h1 className="font-montserrat text-[36px] font-bold leading-[44px] text-details-text-primary-1">
            {t("banner.title")}
          </h1>
          <Image
            src="/kudos/kudos-wordmark.svg"
            alt="SAA 2025 KUDOS"
            width={593}
            height={106}
            className="h-[104px] w-auto"
          />
        </div>
        <div className="flex w-full items-center gap-6">
          <div className="min-w-0 flex-1">
            <ComposeEntryBar />
          </div>
          <SunnerSearchBar />
        </div>
      </div>
    </div>
  );
}
