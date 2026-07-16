"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { PersonIcon } from "@/components/kudos/kudos-icons";
import { SearchIcon } from "@/components/kudos/spotlight/spotlight-board-controls";
import { searchProfiles } from "@/lib/kudos/queries";
import type { Profile } from "@/lib/kudos/types";

const SEARCH_DEBOUNCE_MS = 250;

// "Tìm kiếm profile Sunner" pill: debounced `searchProfiles` lookup with a
// results dropdown; selecting one navigates to that Sunner's profile.
export function SunnerSearchBar() {
  const t = useTranslations("KudosLiveBoard");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const requestId = ++requestIdRef.current;
    const trimmed = query.trim();
    debounceRef.current = setTimeout(() => {
      if (trimmed.length === 0) {
        if (requestIdRef.current === requestId) setResults([]);
        return;
      }
      searchProfiles(query)
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
  }, [query]);

  function handleSelect(profile: Profile) {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    window.location.assign(`/profile/${profile.id}`);
  }

  return (
    // fix-bug: a flat `sm:max-w-[420px]` left too little room for the
    // sibling ComposeEntryBar's (flex-1) placeholder text at tablet widths
    // (e.g. iPad Pro 1024px), forcing it to wrap 3 lines. Scale the cap down
    // at narrower breakpoints so the entry bar keeps enough width to stay at
    // 1-2 lines; the full 420px design width only applies once xl: (1280px)
    // guarantees the entry bar has room to spare.
    <div className="relative w-full sm:max-w-[340px] lg:max-w-[380px] xl:max-w-[420px]">
      <div className="flex h-14 w-full items-center gap-3 rounded-full border border-details-border bg-details-textbutton-normal px-4 sm:h-[72px] sm:gap-4 sm:px-6">
        <SearchIcon size={20} />
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="sunner-search-listbox"
          aria-autocomplete="list"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 100)}
          placeholder={t("sunnerSearch.placeholder")}
          className="w-full bg-transparent font-montserrat text-sm font-bold text-details-text-secondary-1 placeholder:font-bold placeholder:text-details-text-secondary-1 focus:outline-none sm:text-base"
        />
      </div>
      {isOpen && results.length > 0 && (
        <ul
          id="sunner-search-listbox"
          role="listbox"
          className="scrollbar-thin absolute z-20 mt-2 flex max-h-80 w-full flex-col gap-0.5 overflow-y-auto rounded-lg border border-details-border bg-details-background p-1.5 shadow-lg"
        >
          {results.map((profile) => (
            <li key={profile.id} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(profile)}
                className="flex w-full items-center gap-4 rounded-xs px-5 py-1.5 text-left hover:bg-details-dropdown-list-selected"
              >
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-details-textbutton-normal text-details-text-secondary-2">
                    <PersonIcon />
                  </span>
                )}
                <span className="flex flex-col">
                  <span className="font-montserrat text-base font-bold text-details-text-secondary-1">
                    {profile.full_name ?? t("card.unknownUser")}
                  </span>
                  <span className="font-montserrat text-sm font-bold text-details-text-secondary-2">{profile.department}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {isOpen && query.trim().length > 0 && results.length === 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-details-border bg-details-background p-4 text-center font-montserrat text-sm text-details-text-secondary-2 shadow-lg">
          {t("sunnerSearch.noResults")}
        </div>
      )}
    </div>
  );
}
