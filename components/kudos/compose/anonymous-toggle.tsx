"use client";

import { useTranslations } from "next-intl";

type AnonymousToggleProps = {
  isAnonymous: boolean;
  onToggle: (value: boolean) => void;
  name: string;
  onNameChange: (value: string) => void;
};

// "Ẩn danh" checkbox + conditional display-name field. Purely controlled;
// the name field appears only when the toggle is on.
export function AnonymousToggle({ isAnonymous, onToggle, name, onNameChange }: AnonymousToggleProps) {
  const t = useTranslations("KudosModal");

  return (
    <div className="flex flex-1 flex-col gap-2">
      <label className="flex items-center gap-3 font-montserrat text-base font-bold text-details-text-secondary-2">
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(event) => onToggle(event.target.checked)}
            className="peer absolute inset-0 h-5 w-5 cursor-pointer appearance-none rounded border border-details-text-secondary-2 bg-details-text-secondary-1"
          />
          <span className="pointer-events-none absolute inset-1 hidden rounded-xs bg-details-text-secondary-2 peer-checked:block" />
        </span>
        {t("anonymousLabel")}
      </label>
      {isAnonymous && (
        <div className="flex flex-1 items-center gap-4">
          <label
            htmlFor="kudos-anonymous-name-input"
            className="w-fit shrink-0 whitespace-nowrap font-montserrat text-lg font-bold text-details-text-primary-2"
          >
            {t("anonymousNameLabel")}{" "}
            <span className="text-details-required-mark" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="kudos-anonymous-name-input"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={t("anonymousNamePlaceholder")}
            className="h-12 flex-1 rounded-lg border border-details-border bg-details-text-secondary-1 px-5 font-montserrat text-sm font-bold text-details-text-primary-2 placeholder:text-details-text-secondary-2 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
