import { readFileSync } from "fs";
import { test, expect } from "@playwright/test";
import { loadEnv } from "./load-env";

/**
 * Derives the signed-in fixture user's id straight from the storageState
 * cookie `global-setup.ts` minted (`sb-<host>-auth-token`, value
 * `base64-` + base64url(session JSON)) — never hardcode a stranger's id
 * here, since FR-007 explicitly requires the avatar to navigate to the
 * signed-in user's OWN profile.
 */
function signedInUserId(): string {
  const storageState = JSON.parse(readFileSync("e2e/.auth/user.json", "utf8"));
  const authCookie = storageState.cookies.find((cookie: { name: string }) => cookie.name.includes("auth-token"));
  if (!authCookie) throw new Error("No auth-token cookie found in e2e/.auth/user.json");
  const session = JSON.parse(Buffer.from(authCookie.value.replace(/^base64-/, ""), "base64url").toString());
  return session.user.id as string;
}

test.describe("Site navigation — authenticated", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("header shows all 3 nav tabs, bell, and avatar", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    await expect(page.getByRole("link", { name: "Giới thiệu SAA 2025" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Thông tin giải thưởng" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sun* Kudos" })).toBeVisible();
    await expect(page.getByTestId("header-bell")).toBeVisible();
    await expect(page.getByRole("button", { name: "Xem trang cá nhân của tôi" })).toBeVisible();
  });

  test("language switcher changes the nav labels to English (fix-bug: dropdown used to sit at the same z-index as KudosBanner and swallow clicks on its options)", async ({
    page,
  }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    await page.getByRole("button", { name: "VN" }).click();
    await page.getByRole("option", { name: "EN" }).click();

    await expect(page.getByRole("link", { name: "About SAA 2025" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Giới thiệu SAA 2025" })).toHaveCount(0);
  });

  test("clicking About SAA 2025 navigates there and highlights the tab", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    await page.getByRole("link", { name: "Giới thiệu SAA 2025" }).click();
    await page.waitForURL(/\/about-saa-2025$/);

    await expect(page.getByRole("link", { name: "Giới thiệu SAA 2025" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Thông tin giải thưởng" })).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Sun* Kudos" })).not.toHaveAttribute("aria-current", "page");
  });

  test("clicking Award Information navigates there and highlights the tab", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    await page.getByRole("link", { name: "Thông tin giải thưởng" }).click();
    await page.waitForURL(/\/award-information$/);

    await expect(page.getByRole("link", { name: "Thông tin giải thưởng" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Giới thiệu SAA 2025" })).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Sun* Kudos" })).not.toHaveAttribute("aria-current", "page");
  });

  test("clicking Sun* Kudos from a mock page returns to /kudos and highlights the tab", async ({ page }) => {
    await page.goto("/about-saa-2025");
    await page.waitForURL(/\/about-saa-2025$/);

    await page.getByRole("link", { name: "Sun* Kudos" }).click();
    await page.waitForURL(/\/kudos$/);

    await expect(page.getByRole("link", { name: "Sun* Kudos" })).toHaveAttribute("aria-current", "page");
  });

  test("avatar opens a dropdown menu with Profile and Logout, closes on outside click", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    await page.getByRole("button", { name: "Xem trang cá nhân của tôi" }).click();
    await expect(page.getByRole("menuitem", { name: "Hồ sơ" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Đăng xuất" })).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("Profile menu item navigates to the signed-in user's own profile, not another user's", async ({ page }) => {
    const ownId = signedInUserId();

    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    await page.getByRole("button", { name: "Xem trang cá nhân của tôi" }).click();
    await page.getByRole("menuitem", { name: "Hồ sơ" }).click();
    await page.waitForURL(new RegExp(`/profile/${ownId}$`));

    expect(page.url()).toContain(`/profile/${ownId}`);
  });

  test("no tab is highlighted on a profile page", async ({ page }) => {
    const ownId = signedInUserId();

    await page.goto(`/profile/${ownId}`);
    await page.waitForURL(new RegExp(`/profile/${ownId}$`));

    await expect(page.getByRole("link", { name: "Giới thiệu SAA 2025" })).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Thông tin giải thưởng" })).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Sun* Kudos" })).not.toHaveAttribute("aria-current", "page");
  });
});

test.describe("Site navigation — unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/login header shows only logo and language switcher, no nav chrome", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("link", { name: "Giới thiệu SAA 2025" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Thông tin giải thưởng" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Sun* Kudos" })).toHaveCount(0);
    await expect(page.getByTestId("header-bell")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Xem trang cá nhân của tôi" })).toHaveCount(0);
  });

  test("direct nav to /about-saa-2025 redirects to /login", async ({ page }) => {
    await page.goto("/about-saa-2025");
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    expect(page.url()).toMatch(/\/login/);
  });

  test("direct nav to /award-information redirects to /login", async ({ page }) => {
    await page.goto("/award-information");
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    expect(page.url()).toMatch(/\/login/);
  });
});

/**
 * Own describe block, own throwaway user — deliberately NOT the shared
 * `e2e/.auth/user.json` fixture. Supabase `signOut()` revokes the refresh
 * token for every session belonging to that user; reusing the shared fixture
 * here would invalidate it for every other spec relying on the same storage
 * state. Mints a one-off session the same way `global-setup.ts` does, scoped
 * to this test only.
 */
test.describe("Site navigation — logout", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Logout menu item signs out and redirects to /login", async ({ page }) => {
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
    const email = "e2e-logout-test@example.com";

    await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email, email_confirm: true }),
    }); // ignore the response: a 422 here just means the user already exists from a prior run

    const linkResponse = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ type: "magiclink", email }),
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
    await page.context().addCookies([
      { name: cookieName, value: cookieValue, domain: "127.0.0.1", path: "/", httpOnly: false, secure: false },
    ]);

    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    await page.getByRole("button", { name: "Xem trang cá nhân của tôi" }).click();
    await page.getByRole("menuitem", { name: "Đăng xuất" }).click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    expect(page.url()).toMatch(/\/login/);
  });
});
