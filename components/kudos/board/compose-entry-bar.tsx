"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { KudosModal } from "@/components/kudos/compose/kudos-modal";
import { PenIcon } from "@/components/kudos/kudos-icons";

// Compose trigger pill (MoMorph A.1, 2940:13449); owns its own KudosModal state.
export function ComposeEntryBar() {
  const t = useTranslations("KudosLiveBoard");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-full border border-details-border bg-details-textbutton-normal px-3 py-4 text-left sm:gap-4 sm:px-4 sm:py-6"
      >
        <PenIcon className="shrink-0 text-details-text-secondary-1" />
        <span className="font-montserrat text-sm font-bold leading-5 tracking-[0.15px] text-details-text-secondary-1 sm:text-base sm:leading-6">
          {t("entryBar.placeholder")}
        </span>
      </button>
      <KudosModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
