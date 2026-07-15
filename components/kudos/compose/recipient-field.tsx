"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { DownIcon, PersonIcon } from "@/components/kudos/kudos-icons";
import { searchProfiles } from "@/lib/kudos/queries";
import type { Profile } from "@/lib/kudos/types";

type RecipientFieldProps = {
  value: Profile | null;
  onChange: (profile: Profile | null) => void;
  excludeUserId?: string;
};

const SEARCH_DEBOUNCE_MS = 250;

/**
 * "Người nhận" autocomplete: debounced search over `searchProfiles`,
 * exactly-one selection.
 */
export function RecipientField({ value, onChange, excludeUserId }: RecipientFieldProps) {
  const t = useTranslations("KudosModal");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length === 0) {
      return;
    }
    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(() => {
      searchProfiles(query, excludeUserId)
        .then((profiles) => {
          if (requestIdRef.current === requestId) setResults(profiles);
        })
        .catch(() => {
          if (requestIdRef.current === requestId) setResults([]);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, excludeUserId]);

  function handleSelect(profile: Profile) {
    onChange(profile);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  function handleInputChange(next: string) {
    setQuery(next);
    setIsOpen(true);
    if (next.trim().length === 0) setResults([]);
    if (value) onChange(null);
  }

  const displayValue = value && query.length === 0 ? value.full_name ?? t("unknownUser") : query;

  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <label className="font-montserrat text-lg font-bold text-details-text-primary-2 sm:w-[120px] sm:shrink-0 sm:whitespace-nowrap">
        {t("recipientLabel")}{" "}
        <span className="text-details-required-mark" aria-hidden="true">
          *
        </span>
      </label>
      <div className="relative flex-1">
        <div className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-details-border bg-details-text-secondary-1 px-4 sm:h-12 sm:gap-4 sm:px-5">
          <input
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="recipient-listbox"
            aria-autocomplete="list"
            value={displayValue}
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 100)}
            placeholder={t("recipientPlaceholder")}
            className="w-full bg-transparent font-montserrat text-base font-bold text-details-text-primary-2 placeholder:text-details-text-secondary-2 focus:outline-none"
          />
          <DownIcon />
        </div>
        {isOpen && results.length > 0 && (
          <ul
            id="recipient-listbox"
            role="listbox"
            className="absolute z-20 mt-2 flex max-h-80 w-full flex-col gap-0.5 overflow-y-auto rounded-lg border border-details-border bg-details-background p-1.5 shadow-lg"
          >
            {results.map((profile) => (
              <li key={profile.id} role="option" aria-selected={value?.id === profile.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(profile)}
                  className={`flex w-full items-center gap-4 rounded-xs px-5 py-1.5 text-left hover:bg-details-dropdown-list-selected ${
                    value?.id === profile.id ? "bg-details-dropdown-list-selected" : ""
                  }`}
                >
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-details-textbutton-normal text-details-text-secondary-2">
                      <PersonIcon />
                    </span>
                  )}
                  <span className="flex flex-col gap-1">
                    <span className="font-montserrat text-xl font-bold text-details-text-secondary-1">
                      {profile.full_name ?? t("unknownUser")}
                    </span>
                    <span className="font-montserrat text-base font-bold text-details-text-secondary-2">
                      {profile.department}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {isOpen && query.trim().length > 0 && results.length === 0 && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-details-border bg-details-text-secondary-1 p-4 text-center font-montserrat text-sm text-details-text-secondary-2 shadow-lg">
            {t("recipientNoResults")}
          </div>
        )}
      </div>
    </div>
  );
}
