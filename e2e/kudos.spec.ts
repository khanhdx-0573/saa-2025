import { test, expect } from "@playwright/test";

test("shows a validation message when submitting an incomplete form", async ({ page }) => {
  await page.goto("/kudos");

  await page.getByRole("button", { name: "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Submit button is clickable even with every field empty — clicking it
  // must surface the validation message instead of doing nothing.
  await dialog.getByRole("button", { name: "Gửi", exact: true }).click();
  await expect(
    page.getByText("Bạn cần điền đủ Người nhận, Danh hiệu, Lời nhắn gửi và Hashtag để gửi Kudos!"),
  ).toBeVisible();
  await expect(dialog).toBeVisible();
});

test("compose and submit a kudos end to end", async ({ page }) => {
  await page.goto("/kudos");

  await page.getByRole("button", { name: "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Người nhận: search an existing seeded profile and pick the first match.
  // Scoped to the dialog — the board shell's SunnerSearchBar is also a
  // role="combobox" now (fix-bug: added the missing "Tìm kiếm profile
  // Sunner" search box), so an unscoped query is ambiguous.
  await dialog.getByRole("combobox").fill("Dang");
  const firstRecipient = page.getByRole("option").first();
  await expect(firstRecipient).toBeVisible();
  await firstRecipient.click();

  // Danh hiệu
  await page.getByPlaceholder("Dành tặng một danh hiệu cho đồng đội").fill("Người truyền cảm hứng");

  // Nội dung (Tiptap editor)
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("Cảm ơn bạn đã luôn hỗ trợ team hết mình!");

  // Hashtag: open the picker and select one tag. Scoped to the dialog because
  // the Live Board (behind the modal) has its own unrelated "Hashtag" filter
  // dropdown; this button's accessible name also includes the max-count hint
  // text ("Hashtag Tối đa N"), hence the prefix match instead of exact.
  await dialog.getByRole("button", { name: /^Hashtag/ }).click();
  const firstHashtagOption = page.getByRole("option").filter({ hasText: "#" }).first();
  await expect(firstHashtagOption).toBeVisible();
  await firstHashtagOption.click();
  // Dismiss the hashtag popover via an outside click — Escape would bubble to
  // the native <dialog> and close the whole modal instead.
  await dialog.getByRole("heading").click();

  // Submit — succeeds only once every required field above is genuinely filled.
  await dialog.getByRole("button", { name: "Gửi", exact: true }).click();
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
});
