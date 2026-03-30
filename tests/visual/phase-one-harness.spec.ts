import { expect, test } from "@playwright/test";

test("phase-one harness renders the baseline chart", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /minimal model data/i })).toBeVisible();
  const frame = page.locator(".chart-frame");
  await expect(frame).toBeVisible();
  await expect(frame).toHaveScreenshot("phase-one-harness.png");
});

test("phase-one harness keeps a deterministic smaller-layout baseline", async ({ page }) => {
  await page.setViewportSize({ width: 840, height: 1100 });
  await page.goto("/");
  const frame = page.locator(".chart-frame");
  await expect(frame).toBeVisible();
  await expect(frame).toHaveScreenshot("phase-one-harness-narrow.png");
});
