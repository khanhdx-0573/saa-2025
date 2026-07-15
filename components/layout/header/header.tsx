"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { BellIcon } from "@/components/layout/header/header-icons";
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
  const t = useTranslations("Header");

  // Unauthenticated (/login, /auth/*): minimal header — no nav tabs, bell, or avatar.
  if (!user) {
    return (
      <header className="flex w-full items-center justify-between bg-details-header-overlay px-6 py-3 lg:px-36">
        <Image
          src="/login/sun-logo.png"
          alt="Sun* Annual Awards"
          width={52}
          height={48}
          className="h-12 w-[52px] object-cover"
        />
        <LanguageSwitcher />
      </header>
    );
  }

  return (
    <header className="flex w-full items-center justify-between bg-details-header-overlay px-6 py-3 lg:px-36">
      <div className="flex items-center gap-10 lg:gap-16">
        <Image
          src="/login/sun-logo.png"
          alt="Sun* Annual Awards"
          width={52}
          height={48}
          className="h-12 w-[52px] object-cover"
        />
        <nav className="flex items-center gap-8">
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

      <div className="flex items-center gap-4 lg:gap-6">
        {/* Decorative only: aria-hidden so assistive tech skips it; data-testid still gives tests a stable hook. */}
        <span data-testid="header-bell" aria-hidden="true" className="relative inline-flex text-details-text-secondary-1">
          <BellIcon />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-details-error" />
        </span>

        <LanguageSwitcher />

        <ProfileDropdown userId={user.id} />
      </div>
    </header>
  );
}
