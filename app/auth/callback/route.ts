import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/kudos";
  if (!next.startsWith("/")) {
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const nextWithLoginSignal = `${next}${next.includes("?") ? "&" : "?"}login=success`;
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${nextWithLoginSignal}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${nextWithLoginSignal}`);
      } else {
        return NextResponse.redirect(`${origin}${nextWithLoginSignal}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
