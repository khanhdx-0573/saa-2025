"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export function GoogleLoginButton() {
  const t = useTranslations("LoginPage");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleLogin}
        className="flex shrink-0 items-center gap-2 overflow-clip rounded-lg bg-details-text-primary-1 px-6 py-4"
      >
        <span className="font-montserrat text-[22px] font-bold leading-7 text-details-text-primary-2">
          {t("googleButton")}
        </span>
        <Image src="/login/google-icon.svg" alt="" width={24} height={24} />
      </button>
      {error && <p className="font-montserrat text-sm text-red-400">{error}</p>}
    </div>
  );
}
