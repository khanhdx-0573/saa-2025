import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3000",
    storageState: "e2e/.auth/user.json",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://127.0.0.1:3000",
    // Always force a fresh build+start — this sandbox has repeatedly left stale
    // `next dev`/`next start` processes bound to :3000 across sessions, and
    // `reuseExistingServer: true` would silently reuse one of those (serving an
    // outdated build, sometimes even a dev-mode bundle with its own hydration
    // bugs) instead of the current code. Costs a rebuild per run; worth it.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
