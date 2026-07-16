"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ChevronRightIcon, ProfileFilledIcon } from "@/components/layout/header/header-icons";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-details-text-primary-1 focus-visible:rounded-xs";

/* `w-full justify-between` (not just `gap`): rows have different label widths, so
   stretching each to full width + pinning its icon to the end keeps the icons aligned. */
const MENU_ITEM =
  "group flex w-full cursor-pointer items-center justify-between gap-2 rounded px-4 py-4 font-montserrat text-base font-bold text-details-text-secondary-1 hover:bg-details-textbutton-normal";

export function ProfileDropdown({ userId }: { userId: string }) {
  const t = useTranslations("Header");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setIsOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success(t("logoutSuccess"));
    router.push("/login");
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("avatarAriaLabel")}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm border border-details-border text-details-text-secondary-1 hover:bg-white/10 ${FOCUS_RING}`}
      >
        <ProfileFilledIcon />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-20 flex w-max origin-top-right animate-[fadeSlideIn_200ms_ease-out] flex-col overflow-clip rounded-lg border border-details-border bg-details-container-2 p-1.5"
        >
          <Link
            href={`/profile/${userId}`}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className={`${MENU_ITEM} ${FOCUS_RING}`}
          >
            <span className="[text-shadow:none] group-hover:[text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]">
              {t("profile")}
            </span>
            <ProfileFilledIcon className="h-6 w-6" />
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className={`${MENU_ITEM} ${FOCUS_RING}`}
          >
            {t("logout")}
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
