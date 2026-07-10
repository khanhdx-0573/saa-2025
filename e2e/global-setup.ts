import { chromium } from "@playwright/test";
import { loadEnv } from "./load-env";

const TEST_USER_EMAIL = "e2e-test@example.com";
const TEST_USER_FULL_NAME = "E2E Test User";

/**
 * Provisions one authenticated Playwright `storageState` shared by every spec.
 * There is no way to automate real Google OAuth, so this creates (or reuses) a
 * fixed Supabase user via the local Admin API and mints its session directly.
 *
 * Why not just navigate a browser through the magic-link redirect: this local
 * Supabase version's `generate_link` always returns an *implicit*-flow link
 * (tokens in a URL hash), but our app's `@supabase/ssr` browser client is
 * hardcoded to `flowType: "pkce"` (expects a `?code=`) — so letting a page
 * "just load" that link would never actually establish a session. Calling
 * `/auth/v1/verify` directly returns the session as plain JSON instead, which
 * this writes into the exact cookie `@supabase/ssr` reads on boot: name
 * `sb-<first-hostname-label>-auth-token`, value `base64-` + base64url(JSON)
 * (see `@supabase/supabase-js`'s `defaultStorageKey` and `@supabase/ssr`'s
 * `cookies.ts` — no chunking needed while the session JSON stays under the
 * 3180-byte-per-cookie limit, true for this fixture user).
 */
export default async function globalSetup(): Promise<void> {
  loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY must be set (check .env / .env.local)");
  }

  const authHeaders = {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };

  await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      email: TEST_USER_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: TEST_USER_FULL_NAME },
    }),
  }); // ignore the response: a 422 here just means the user already exists from a prior run

  const linkResponse = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ type: "magiclink", email: TEST_USER_EMAIL }),
  });
  const link = await linkResponse.json();
  if (!link.hashed_token) {
    throw new Error(`generate_link did not return a hashed_token: ${JSON.stringify(link)}`);
  }

  const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: secretKey, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", token_hash: link.hashed_token }),
  });
  const session = await verifyResponse.json();
  if (!session.access_token) {
    throw new Error(`/verify did not return a session: ${JSON.stringify(session)}`);
  }

  const cookieName = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
  const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([
    { name: cookieName, value: cookieValue, domain: "127.0.0.1", path: "/", httpOnly: false, secure: false },
  ]);

  // Confirm the cookie actually authenticates against the real middleware
  // before saving it for every spec to reuse.
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/kudos");
  await page.waitForURL(/\/kudos$/, { timeout: 15_000 });
  await context.storageState({ path: "e2e/.auth/user.json" });
  await browser.close();
}
