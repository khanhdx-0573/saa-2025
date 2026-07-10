import { test, expect } from "@playwright/test";

test("shows a validation message when submitting an incomplete form", async ({ page }) => {
  await page.goto("/kudos");

  await page.getByRole("button", { name: "Viết Kudo" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Submit button is clickable even with every field empty — clicking it
  // must surface the validation message instead of doing nothing.
  await page.getByRole("button", { name: "Gửi" }).click();
  await expect(
    page.getByText("Bạn cần điền đủ Người nhận, Danh hiệu, Lời nhắn gửi và Hashtag để gửi Kudos!"),
  ).toBeVisible();
  await expect(dialog).toBeVisible();
});

test("compose and submit a kudos end to end", async ({ page }) => {
  await page.goto("/kudos");

  await page.getByRole("button", { name: "Viết Kudo" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Người nhận: search an existing seeded profile and pick the first match.
  await page.getByRole("combobox").fill("Dang");
  const firstRecipient = page.getByRole("option").first();
  await expect(firstRecipient).toBeVisible();
  await firstRecipient.click();

  // Danh hiệu
  await page.getByPlaceholder("Dành tặng một danh hiệu cho đồng đội").fill("Người truyền cảm hứng");

  // Nội dung (Tiptap editor)
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("Cảm ơn bạn đã luôn hỗ trợ team hết mình!");

  // Hashtag: open the picker and select one tag.
  await page.getByRole("button", { name: /^Hashtag/ }).click();
  const firstHashtagOption = page.getByRole("option").filter({ hasText: "#" }).first();
  await expect(firstHashtagOption).toBeVisible();
  await firstHashtagOption.click();
  // Dismiss the hashtag popover via an outside click — Escape would bubble to
  // the native <dialog> and close the whole modal instead.
  await dialog.getByRole("heading").click();

  // Submit — succeeds only once every required field above is genuinely filled.
  await page.getByRole("button", { name: "Gửi" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
});
