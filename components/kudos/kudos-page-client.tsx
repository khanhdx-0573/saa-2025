"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { KudosModal } from "@/components/kudos/kudos-modal";

export function KudosPageClient() {
  const t = useTranslations("KudosPage");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 overflow-clip rounded-lg bg-details-text-primary-1 px-6 py-4"
      >
        <span className="font-montserrat text-[22px] font-bold leading-7 text-details-text-primary-2">
          {t("writeKudoButton")}
        </span>
      </button>
      <KudosModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
