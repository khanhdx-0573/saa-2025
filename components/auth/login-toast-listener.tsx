"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const LOGIN_SUCCESS_PARAM = "login";
const LOGIN_SUCCESS_VALUE = "success";

/**
 * One-time "logged in" toast right after the OAuth callback redirect
 * (`app/auth/callback/route.ts`) lands on an authenticated page. Reads
 * `window.location` directly instead of `useSearchParams` — this only needs
 * to run once on mount, so it skips opting the whole route into the
 * Suspense-boundary requirement that hook carries.
 */
export function LoginToastListener() {
  const t = useTranslations("Header");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(LOGIN_SUCCESS_PARAM) !== LOGIN_SUCCESS_VALUE) return;

    toast.success(t("loginSuccess"));
    url.searchParams.delete(LOGIN_SUCCESS_PARAM);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  return null;
}
