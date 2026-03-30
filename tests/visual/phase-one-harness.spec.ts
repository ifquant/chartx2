import { expect, test } from "@playwright/test";

test("phase-one harness renders the baseline chart", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /minimal model data/i })).toBeVisible();
  const frame = page.locator(".chart-frame");
  await expect(frame).toBeVisible();
  await expect(frame).toHaveScreenshot("phase-one-harness.png");
});
