"use client";

import { useTranslations } from "next-intl";
import { LinkIcon } from "@/components/kudos/kudos-icons";
import { useToast } from "@/components/ui/toast";

type CopyLinkButtonProps = {
  url: string;
};

/** Copies `url` via the Clipboard API, surfacing a success/error toast (never
 *  fails silently if the Clipboard API is unavailable or denied). */
export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const t = useTranslations("KudosLiveBoard");
  const { show } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      show(t("copyLink.success"));
    } catch {
      show(t("copyLink.error"));
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex shrink-0 cursor-pointer items-center gap-1 rounded px-2 py-2 font-montserrat text-sm font-bold text-details-text-primary-2 hover:bg-details-textbutton-normal sm:px-4 sm:py-4 sm:text-base"
    >
      {t("copyLink.button")}
      <LinkIcon />
    </button>
  );
}
