import { test, expect } from "@playwright/test";

// Override the project's default authenticated `storageState` — the login
// screen only matters to a visitor who is NOT signed in yet.
test.use({ storageState: { cookies: [], origins: [] } });

test("redirects an unauthenticated visitor to the login screen", async ({ page }) => {
  await page.goto("/kudos");
  await expect(page).toHaveURL(/\/login/);
});

test("renders the headline and Google sign-in button", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("Bắt đầu hành trình của bạn cùng SAA 2025.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Google/ })).toBeVisible();
});

test("clicking Google sign-in starts the OAuth flow", async ({ page }) => {
  await page.goto("/login");

  // Abort the authorize request before it can 302 the browser on to a real
  // Google login page — we only prove the click is wired correctly, never
  // automate a real third-party OAuth flow (AGENTS.md).
  await page.route("**/auth/v1/authorize**", (route) => route.abort());
  const authorizeRequest = page.waitForRequest((req) => req.url().includes("/auth/v1/authorize") && req.url().includes("provider=google"));
  await page.getByRole("button", { name: /Google/ }).click();

  await expect(authorizeRequest).resolves.toBeTruthy();
});
