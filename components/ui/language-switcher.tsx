"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import Image from "next/image";
import { locales, type Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/set-locale";

const FLAG_BY_LOCALE: Record<Locale, string> = {
  vi: "/login/vn-flag.svg",
  en: "/login/gb-flag.svg",
};

// Design shows country labels ("VN"/"EN"), not the ISO language codes ("VI"/"EN").
const LABEL_BY_LOCALE: Record<Locale, string> = {
  vi: "VN",
  en: "EN",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("Header");
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  function handleSelect(nextLocale: Locale) {
    setIsOpen(false);
    if (nextLocale === locale) return;
    startTransition(() => {
      setLocale(nextLocale);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t("language")}
        disabled={isPending}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-[90px] cursor-pointer items-center gap-2 rounded-sm py-1 pl-2 hover:bg-white/10 disabled:cursor-default"
      >
        <span className="flex items-center gap-1">
          <Image src={FLAG_BY_LOCALE[locale]} alt="" width={20} height={15} className="object-contain" />
          <span className="font-montserrat text-sm font-medium text-details-text-secondary-1">
            {LABEL_BY_LOCALE[locale]}
          </span>
        </span>
        <Image src="/login/chevron-down.svg" alt="" width={24} height={24} />
      </button>

      <div
        className={`absolute right-0 z-20 flex flex-col items-start overflow-clip rounded-lg border border-details-border bg-details-container-2 p-1.5 ${
          isOpen ? "animate-[fadeSlideIn_200ms_ease-out]" : "hidden"
        }`}
      >
        <ul role="listbox">
          {locales.map((value) => (
            <li key={value} role="option" aria-selected={value === locale} className="w-full">
              <button
                type="button"
                onClick={() => handleSelect(value)}
                className="flex h-10 w-[108px] cursor-pointer items-center justify-start gap-1 pl-4 rounded-xs hover:bg-details-dropdown-list-selected"
              >
                <Image src={FLAG_BY_LOCALE[value]} alt="" width={20} height={15} className="object-contain" />
                <span className="font-montserrat text-sm font-medium text-details-text-secondary-1">
                  {LABEL_BY_LOCALE[value]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
