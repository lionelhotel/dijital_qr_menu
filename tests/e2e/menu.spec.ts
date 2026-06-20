import { expect, test } from "@playwright/test";

test("opens QR menu and switches language", async ({ page }) => {
  await page.goto("/menu");
  await expect(page).toHaveURL(/\/(tr|en|es)\/menu/);
  await page.getByRole("button", { name: "EN" }).click();
  await expect(page).toHaveURL(/\/en\/menu/);
});

test("searches products and opens detail", async ({ page }) => {
  await page.goto("/en/menu");
  await page.getByRole("link", { name: /Restaurant Menu/i }).click();
  await page.getByRole("link", { name: /Main Courses/i }).click();
  await page.getByPlaceholder("Search menu").fill("salmon");
  await page.getByRole("button", { name: /Grilled Salmon/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
