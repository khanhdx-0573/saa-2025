"use client";

import { useTranslations } from "next-intl";
import { MAX_KUDOS_TITLE_CHARS } from "@/lib/kudos/validation";

type TitleFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * "Danh hiệu" field: the title/honor the sender dedicates to the recipient,
 * shown as the Kudos' headline. Plain controlled text input — no
 * autocomplete/debounce needed (per MoMorph Frame 552, no design item was
 * authored for this field originally; confirmed from the frame node tree).
 */
export function TitleField({ value, onChange }: TitleFieldProps) {
  const t = useTranslations("KudosModal");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label
          htmlFor="kudos-title-input"
          className="font-montserrat text-lg font-bold text-details-text-primary-2 sm:w-[120px] sm:shrink-0 sm:whitespace-nowrap"
        >
          {t("titleLabel")}{" "}
          <span className="text-details-required-mark" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="kudos-title-input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={MAX_KUDOS_TITLE_CHARS}
          placeholder={t("titlePlaceholder")}
          className="h-11 flex-1 rounded-lg border border-details-border bg-details-text-secondary-1 px-4 font-montserrat text-sm font-bold text-details-text-primary-2 placeholder:text-details-text-secondary-2 focus:outline-none sm:h-12 sm:px-5"
        />
      </div>
      <div className="hidden items-start gap-4 sm:flex">
        <span className="w-[120px] shrink-0" aria-hidden="true" />
        <p className="whitespace-pre-line font-montserrat text-sm font-bold text-details-text-secondary-2">
          {t("titleHelper")}
        </p>
      </div>
      <p className="whitespace-pre-line font-montserrat text-sm font-bold text-details-text-secondary-2 sm:hidden">
        {t("titleHelper")}
      </p>
    </div>
  );
}
