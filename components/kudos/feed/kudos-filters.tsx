"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { KudosFilters as KudosFiltersValue } from "@/lib/kudos/types";

export type KudosFiltersProps = {
  value: KudosFiltersValue;
  hashtags: { id: number; name: string }[];
  departments: string[];
  onChange: (next: KudosFiltersValue) => void;
};

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5.5 9.5L12 16L18.5 9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type DropdownOption = { key: string; label: string; selected: boolean };

type FilterDropdownProps = {
  label: string;
  selectedLabel: string;
  allOptionLabel: string;
  noOptionsLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  options: DropdownOption[];
  onSelect: (key: string) => void;
};

/** Single Hashtag/Phòng ban dropdown trigger + listbox (B.1.1/B.1.2 button pattern). */
function FilterDropdown({
  label,
  selectedLabel,
  allOptionLabel,
  noOptionsLabel,
  isOpen,
  onToggle,
  options,
  onSelect,
}: FilterDropdownProps) {
  const isFiltered = selectedLabel !== allOptionLabel;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded border border-details-border bg-details-textbutton-normal px-4 py-4 font-montserrat text-base font-bold tracking-[0.15px] text-details-text-secondary-1"
      >
        {isFiltered ? selectedLabel : label}
        <ChevronDownIcon className={isOpen ? "rotate-180" : undefined} />
      </button>
      {isOpen && (
        <ul
          role="listbox"
          // `max-h-[420px]` fits every current option without a scrollbar (the
          // list should read as fully open); overflow stays on as a safety net.
          className="scrollbar-thin absolute right-0 z-20 mt-2 max-h-[420px] w-56 overflow-y-auto rounded border border-details-border bg-details-background py-2 shadow-lg"
        >
          {options.length <= 1 ? (
            <li className="px-4 py-2 font-montserrat text-sm font-bold text-details-text-secondary-2">
              {noOptionsLabel}
            </li>
          ) : (
            options.map((option) => (
              <li key={option.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.selected}
                  onClick={() => onSelect(option.key)}
                  className={`w-full px-4 py-2 text-left font-montserrat text-sm font-bold text-details-text-secondary-1 hover:bg-details-textbutton-normal ${
                    option.selected ? "bg-details-dropdown-list-selected" : ""
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/**
 * Hashtag + Phòng ban filter dropdowns. Fully controlled by `value`/`onChange`
 * from the board shell; this component holds only transient "which dropdown is
 * open" state. Selecting an option (or "Tất cả" to clear) calls `onChange`.
 */
export function KudosFilters({ value, hashtags, departments, onChange }: KudosFiltersProps) {
  const t = useTranslations("KudosLiveBoard");
  const allOptionLabel = t("filters.allOption");
  const [openDropdown, setOpenDropdown] = useState<"hashtag" | "department" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedHashtag = hashtags.find((hashtag) => hashtag.id === value.hashtagId);

  const hashtagOptions: DropdownOption[] = [
    { key: "all", label: allOptionLabel, selected: value.hashtagId === null },
    ...hashtags.map((hashtag) => ({
      key: String(hashtag.id),
      label: `#${hashtag.name}`,
      selected: hashtag.id === value.hashtagId,
    })),
  ];

  const departmentOptions: DropdownOption[] = [
    { key: "all", label: allOptionLabel, selected: value.department === null },
    ...departments.map((department) => ({
      key: department,
      label: department,
      selected: department === value.department,
    })),
  ];

  function toggleDropdown(name: "hashtag" | "department") {
    setOpenDropdown((current) => (current === name ? null : name));
  }

  function handleSelectHashtag(key: string) {
    onChange({ ...value, hashtagId: key === "all" ? null : Number(key) });
    setOpenDropdown(null);
  }

  function handleSelectDepartment(key: string) {
    onChange({ ...value, department: key === "all" ? null : key });
    setOpenDropdown(null);
  }

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      <FilterDropdown
        label={t("filters.hashtagLabel")}
        selectedLabel={selectedHashtag ? `#${selectedHashtag.name}` : allOptionLabel}
        allOptionLabel={allOptionLabel}
        noOptionsLabel={t("filters.noOptions")}
        isOpen={openDropdown === "hashtag"}
        onToggle={() => toggleDropdown("hashtag")}
        options={hashtagOptions}
        onSelect={handleSelectHashtag}
      />
      <FilterDropdown
        label={t("filters.departmentLabel")}
        selectedLabel={value.department ?? allOptionLabel}
        allOptionLabel={allOptionLabel}
        noOptionsLabel={t("filters.noOptions")}
        isOpen={openDropdown === "department"}
        onToggle={() => toggleDropdown("department")}
        options={departmentOptions}
        onSelect={handleSelectDepartment}
      />
    </div>
  );
}
