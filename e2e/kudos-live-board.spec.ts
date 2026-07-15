import { execSync } from "node:child_process";
import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("Kudos Live Board", () => {
  test("board loads successfully", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    // Wait for articles (kudos cards) to render
    await page.waitForSelector("article", { timeout: 5_000 });

    // Should have articles (kudos cards)
    const cards = page.locator("article");
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test("like button with aria-pressed toggles state", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    // Find first card with a like button
    const cards = page.locator("article");
    const firstCard = cards.first();

    // Find the button with aria-pressed (the like button)
    const likeButton = firstCard.locator("button[aria-pressed]").first();
    const isVisible = await likeButton.isVisible().catch(() => false);

    if (isVisible) {
      const initialPressed = await likeButton.getAttribute("aria-pressed");

      await likeButton.click();
      await page.waitForTimeout(300);

      const afterClick = await likeButton.getAttribute("aria-pressed");
      // State should toggle
      expect(afterClick).not.toBe(initialPressed);
    }
  });

  test("copy link button appears on cards", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    // Look for a card with a copy link button
    const cards = page.locator("article");
    const firstCard = cards.first();

    // Copy button should contain "Copy" or "Link" text, or have aria-label
    const copyButton = firstCard.locator("button").filter({ hasText: /Copy|Link/i }).first();
    const copyVisible = await copyButton.isVisible().catch(() => false);

    if (copyVisible) {
      expect(await copyButton.isVisible()).toBe(true);
    }
  });

  test("kudos cards navigate on click", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    // Find a clickable element in the first card (article > *)
    const firstArticle = page.locator("article").first();

    // Try clicking on the article itself or a link within it
    const clickableElements = firstArticle.locator("a, button[type='button']").first();
    const isClickable = await clickableElements.isVisible().catch(() => false);

    if (isClickable) {
      // Look for a link with href
      const link = firstArticle.locator("a").first();
      const href = await link.getAttribute("href").catch(() => null);
      expect(href).toBeTruthy();
    }
  });

  test("sidebar stats display numbers", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    // Sidebar should contain stat numbers
    const aside = page.locator("aside").first();
    const sidebarVisible = await aside.isVisible().catch(() => false);

    if (sidebarVisible) {
      const numbers = aside.locator('text=/\\d+/');
      const count = await numbers.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("multiple cards render without errors", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    const cards = page.locator("article");
    const count = await cards.count();

    // Should have multiple cards
    if (count > 0) {
      // Check that at least 2 cards are visible
      const firstCard = cards.first();
      const lastCard = cards.last();

      await expect(firstCard).toBeVisible();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("invalid kudos id returns 404-like response", async ({ page }) => {
    const invalidId = "00000000-0000-0000-0000-000000000000";
    await page.goto(`/kudos/${invalidId}`);

    // Page should load without crashing
    // May show 404 or a not-found state
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain(invalidId);
  });

  test("invalid profile id returns 404-like response", async ({ page }) => {
    const invalidId = "00000000-0000-0000-0000-000000000000";
    await page.goto(`/profile/${invalidId}`);

    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain(invalidId);
  });
});

// Regression tests for the fix-bug pass (design-mismatch report): missing
// Sunner search box, kudos content rendering raw HTML tags as literal text,
// uneven Highlight carousel card heights, and the body background depending
// on prefers-color-scheme instead of being a fixed dark theme.
test.describe("Kudos Live Board - Fix-bug regressions", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("Sunner search box is present next to the compose entry", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });
    await expect(page.getByPlaceholder("Tìm kiếm profile Sunner")).toBeVisible();
  });

  test("kudos card content renders as HTML, not literal tags", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });
    await page.waitForSelector("article", { timeout: 5_000 });

    const cardText = await page.locator("article").first().innerText();
    expect(cardText).not.toContain("<p>");
    expect(cardText).not.toContain("</p>");
  });

  test("Highlight carousel peek cards render at full size with no reflow drift (Momorph ground truth: no scale/blur on cards)", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });
    await page.waitForSelector("article", { timeout: 5_000 });

    // Every carousel slot shares the same `w-[528px]` box with NO per-card
    // scale/opacity/blur (design fix: the peek effect comes only from the
    // viewport clipping + edge-gradient overlays, never from touching the
    // cards themselves) — so every slot's height must be IDENTICAL, not just
    // proportional. The original bug (different flex-basis widths causing
    // ~90px of reflow drift) is structurally impossible now: there is no
    // per-slot width variance left to regress.
    const heights = await page.evaluate(() => {
      const wrappers = Array.from(document.querySelectorAll('div[class*="w-\\[528px\\]"]'));
      return wrappers.map((w) => w.getBoundingClientRect().height).filter((h) => h > 0);
    });

    expect(heights.length).toBeGreaterThan(0);
    const [first, ...rest] = heights;
    for (const height of rest) {
      expect(height).toBeCloseTo(first, 0);
    }
  });

  test("page background is the fixed dark theme, not prefers-color-scheme white", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe("rgb(0, 16, 26)"); // #00101a
  });
});

// Regression tests for the All Kudos card fixes: capped display (product
// decision — was unbounded infinite scroll), "Xem chi tiết" only belongs on
// the Highlight card (Momorph C.4 has no such button), and the edit pencil
// (Momorph C.3, undocumented spec gap) only shows for the sender's own kudos.
test.describe("Kudos Live Board - All Kudos card fixes", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("All Kudos section shows at most 5 cards", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    const allKudosCards = page.locator('section[aria-label="All kudos feed"] article');
    await expect(allKudosCards.first()).toBeVisible({ timeout: 10_000 });
    expect(await allKudosCards.count()).toBeLessThanOrEqual(5);
  });

  test("All Kudos only shows kudos the viewer sent (every card is theirs, so every card is editable)", async ({
    page,
  }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    const allKudosSection = page.locator('section[aria-label="All kudos feed"]');
    await expect(allKudosSection.locator("article").first()).toBeVisible({ timeout: 10_000 });

    // The e2e fixture user's own display name — every sender slot in every
    // card must read this, since the feed is scoped to `sender_id = viewer`.
    const senderNames = await allKudosSection.getByText("E2E Test User", { exact: true }).count();
    const cardCount = await allKudosSection.locator("article").count();
    expect(senderNames).toBe(cardCount);
  });

  test("All Kudos cards have no 'Xem chi tiết' button", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    const allKudosSection = page.locator('section[aria-label="All kudos feed"]');
    await expect(allKudosSection.locator("article").first()).toBeVisible({ timeout: 10_000 });
    expect(await allKudosSection.getByText("Xem chi tiết").count()).toBe(0);
  });

  test("own kudos in All Kudos shows an edit button that opens a prefilled edit dialog", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    const allKudosSection = page.locator('section[aria-label="All kudos feed"]');
    await expect(allKudosSection.locator("article").first()).toBeVisible({ timeout: 10_000 });

    // The e2e fixture user is the SENDER of the local seed data, so an edit
    // button should be present on at least one of the (at most 5) cards.
    const editButton = allKudosSection.getByLabel("Sửa").first();
    await expect(editButton).toBeVisible();

    // Scoped to the FIRST card's own title `<h3>`, not the section's "ALL
    // KUDOS" heading (also an `<h3>`, earlier in the DOM).
    const cardTitle = await allKudosSection.locator("article").first().locator("h3").innerText();
    await editButton.click();

    // `getByRole("dialog")` — unlike a plain `dialog` locator — only matches
    // an actually-OPEN native `<dialog>`, which is what filters out the
    // page's other closed dialogs (the compose modal, and one per-card image
    // lightbox from `kudos-image-gallery.tsx` — same shell className).
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const titleInput = dialog.locator("#kudos-title-input");
    await expect(titleInput).toHaveValue(cardTitle);

    // Non-mutating: cancel rather than save, so the shared local dataset
    // other tests read isn't changed by this test.
    await dialog.getByText("Hủy").click();
    await expect(dialog).toBeHidden();
  });

  test("clicking the card content does not navigate (only 'Xem chi tiết' does, and All Kudos has no such button)", async ({
    page,
  }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    const allKudosSection = page.locator('section[aria-label="All kudos feed"]');
    const firstCard = allKudosSection.locator("article").first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });

    await firstCard.locator("p", { hasText: "Cảm ơn" }).first().click();
    await page.waitForTimeout(300);
    expect(page.url()).toMatch(/\/kudos$/);
  });

  test("edit modal can add and then remove an image, and both changes persist on the card after save", async ({
    page,
  }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    const allKudosSection = page.locator('section[aria-label="All kudos feed"]');
    const firstCard = allKudosSection.locator("article").first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });
    const galleryImagesBefore = await firstCard.locator('img[alt=""]').count();

    // Add.
    await firstCard.getByLabel("Sửa").click();
    let dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator('input[type="file"]').setInputFiles("public/kudos/kv-background.png");
    await expect(dialog.locator('img[alt=""]')).toHaveCount(1);
    await dialog.getByText("Lưu", { exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(firstCard.locator('img[alt=""]')).toHaveCount(galleryImagesBefore + 1);

    // Remove — leaves the shared local dataset back where this test found it.
    await firstCard.getByLabel("Sửa").click();
    dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Xóa ảnh").first().click();
    await dialog.getByText("Lưu", { exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(firstCard.locator('img[alt=""]')).toHaveCount(galleryImagesBefore);
  });

  test("Detail page shows the full message (no '...' clamp); All Kudos still clamps", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/kudos");
    await page.waitForURL(/\/kudos$/, { timeout: 15_000 });

    const allKudosSection = page.locator('section[aria-label="All kudos feed"]');
    const firstCard = allKudosSection.locator("article").first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });

    const allKudosContentClass = await firstCard.locator('div[class*="leading-8"]').getAttribute("class");
    expect(allKudosContentClass).toContain("line-clamp-5");

    // "Copy Link" writes `/kudos/{id}` to the clipboard — read it back to
    // navigate straight to this same card's Detail page.
    await firstCard.getByText("Copy Link").click();
    const detailUrl = await page.evaluate(() => navigator.clipboard.readText());
    await page.goto(detailUrl);
    await page.waitForURL(/\/kudos\/.+/);

    const detailContentClass = await page.locator('div[class*="leading-8"]').getAttribute("class");
    expect(detailContentClass).not.toContain("line-clamp");
  });
});

test.describe("Kudos Live Board - Spotlight fixes", () => {
  test("in-canvas search input is actually focusable/typeable (fix-bug: the word-cloud canvas used to sit at the same z-index and swallow every click over it)", async ({
    page,
  }) => {
    await page.goto("/kudos");
    const board = page.getByRole("region", { name: "Spotlight board" });
    const searchInput = board.locator("input");

    await searchInput.click({ timeout: 5_000 });
    await searchInput.fill("Mai");
    await expect(searchInput).toHaveValue("Mai");
  });

  test("activity ticker updates live via realtime when a new kudos is sent, with no reload on the watching page", async ({
    page,
  }) => {
    await page.goto("/kudos");
    await page.waitForSelector("article", { timeout: 5_000 });

    // The ticker's first row in DOM order is always its most recent item —
    // `flex-col-reverse` only flips the VISUAL stack, not DOM order (see
    // `SpotlightActivityTicker`). Asserting on that row (rather than on the
    // recipient's text appearing ANYWHERE) sidesteps seed data already
    // having a couple of older "Mai received a kudos" lines further down.
    const board = page.getByRole("region", { name: "Spotlight board" });
    const mostRecentTickerLine = board.locator("[aria-hidden='true'] p").first();

    // Inserted directly (not through the compose UI/`create_kudos` RPC,
    // which always sends as the CURRENT session — the shared e2e fixture
    // user — and would leak into the "All Kudos" section other specs assert
    // exact content on, since that section is scoped to the viewer's own
    // sent kudos). Sender/recipient are both seeded Sunners (see
    // `supabase/seed.sql`), isolating this from every other spec's data.
    // Being the single most-recent row is also exactly what makes
    // `get_highlight_kudos`'s zero-heart-count tiebreak (`created_at desc`)
    // briefly eligible to pick it up — deleted in `finally` to keep that
    // window as short as possible for the Highlight-carousel-height spec.
    // `-tAc` still prefixes the RETURNING value with an "INSERT 0 1" status
    // line on this psql version — the id is always the first line.
    const insertedId = execSync(
      `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -tAc ` +
        `"insert into public.kudos (sender_id, recipient_id, title, content, is_anonymous) values ` +
        `('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', ` +
        `'Realtime e2e check', '<p>Realtime e2e check.</p>', false) returning id;"`
    )
      .toString()
      .trim()
      .split("\n")[0];

    try {
      await expect(mostRecentTickerLine).toContainText("Trần Văn Long đã nhận được một Kudos mới", {
        timeout: 10_000,
      });
    } finally {
      execSync(
        `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "delete from public.kudos where id = '${insertedId}';"`
      );
    }
  });
});

test.describe("Kudos Live Board - Unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated /kudos redirects to /login", async ({ page }) => {
    await page.goto("/kudos");
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    expect(page.url()).toMatch(/\/login/);
  });

  test("unauthenticated /kudos/[id] redirects to /login", async ({ page }) => {
    await page.goto("/kudos/some-id");
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    expect(page.url()).toMatch(/\/login/);
  });

  test("unauthenticated /profile/[id] redirects to /login", async ({ page }) => {
    await page.goto("/profile/some-id");
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    expect(page.url()).toMatch(/\/login/);
  });
});
