"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { BellIcon, CloseIcon, HamburgerIcon, ProfileFilledIcon, ChevronRightIcon } from "@/components/layout/header/header-icons";
import { ProfileDropdown } from "@/components/layout/header/profile-dropdown";

type NavItemKey = "navAboutSaa" | "navAwardInfo" | "navKudos";

type NavItem = {
  key: NavItemKey;
  href: string;
  isActive: (pathname: string) => boolean;
};

/** Single source of truth for nav tab order, hrefs, and active-route matching. */
const NAV_ITEMS: NavItem[] = [
  { key: "navAboutSaa", href: "/about-saa-2025", isActive: (pathname) => pathname === "/about-saa-2025" },
  { key: "navAwardInfo", href: "/award-information", isActive: (pathname) => pathname === "/award-information" },
  {
    key: "navKudos",
    href: "/kudos",
    isActive: (pathname) => pathname === "/kudos" || pathname.startsWith("/kudos/"),
  },
];

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-details-text-primary-1 focus-visible:rounded-xs";

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Header");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleMobileLogout() {
    setMobileMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Unauthenticated (/login, /auth/*): minimal header — no nav tabs, bell, or avatar.
  if (!user) {
    return (
      <header className="flex w-full items-center justify-between bg-details-header-overlay px-6 py-3 lg:px-36">
        <Link href="/login" className="shrink-0">
          <Image
            src="/login/sun-logo.png"
            alt="Sun* Annual Awards"
            width={52}
            height={48}
            className="h-12 w-[52px] object-cover"
          />
        </Link>
        <LanguageSwitcher />
      </header>
    );
  }

  return (
    <div ref={mobileMenuRef}>
      <header className="flex w-full items-center justify-between bg-details-header-overlay px-6 py-3 lg:px-36">
        <div className="flex items-center gap-10 lg:gap-16">
          <Link href="/about-saa-2025" className="shrink-0">
            <Image
              src="/login/sun-logo.png"
              alt="Sun* Annual Awards"
              width={52}
              height={48}
              className="h-12 w-[52px] object-cover"
            />
          </Link>
          {/* Desktop nav — hidden on mobile, visible at lg+ */}
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`border-b-2 pb-1 font-montserrat text-base font-bold ${FOCUS_RING} ${
                    active
                      ? "border-details-text-primary-1 text-details-text-primary-1"
                      : "border-transparent text-details-text-secondary-1"
                  }`}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop right cluster — hidden on mobile, visible at lg+ */}
        <div className="hidden items-center gap-6 lg:flex">
          <span data-testid="header-bell" aria-hidden="true" className="relative inline-flex text-details-text-secondary-1">
            <BellIcon />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-details-error" />
          </span>
          <LanguageSwitcher />
          <ProfileDropdown userId={user.id} />
        </div>

        {/* Mobile right cluster — language switcher + hamburger */}
        <div className="flex items-center gap-3 lg:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className={`flex items-center justify-center text-details-text-secondary-1 transition-transform duration-200 ${mobileMenuOpen ? "rotate-90" : "rotate-0"} ${FOCUS_RING}`}
          >
            {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </header>

      {/* Mobile sidebar — slide-down animation via max-height transition */}
      <div
        className={`overflow-hidden border-t border-details-border bg-details-header-overlay transition-all duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col">
          {/* Navigation links */}
          <nav className="flex flex-col px-4 py-3" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item, index) => {
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 font-montserrat text-base font-bold transition-all duration-200 ${FOCUS_RING} ${
                    active
                      ? "bg-details-textbutton-normal text-details-text-primary-1"
                      : "text-details-text-secondary-1 hover:bg-details-textbutton-normal"
                  }`}
                  style={{ transitionDelay: mobileMenuOpen ? `${index * 50}ms` : "0ms" }}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          <div className="mx-4 h-px bg-details-border" />

          {/* Profile link */}
          <Link
            href={`/profile/${user.id}`}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-8 py-4 font-montserrat text-base font-bold text-details-text-secondary-1 transition-colors duration-200 hover:bg-details-textbutton-normal ${FOCUS_RING}`}
          >
            <span className="flex items-center gap-3">
              <ProfileFilledIcon className="h-5 w-5" />
              {t("profile")}
            </span>
            <ChevronRightIcon className="h-5 w-5" />
          </Link>

          <div className="mx-4 h-px bg-details-border" />

          {/* Logout */}
          <button
            type="button"
            onClick={handleMobileLogout}
            className={`flex items-center justify-between px-8 py-4 font-montserrat text-base font-bold text-details-text-secondary-1 transition-colors duration-200 hover:bg-details-textbutton-normal ${FOCUS_RING}`}
          >
            {t("logout")}
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
