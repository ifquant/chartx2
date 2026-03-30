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

test("phase-one harness renders a deterministic crosshair snapshot", async ({ page }) => {
  await page.goto("/");
  const frame = page.locator(".chart-frame");
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("phase-one harness canvas is missing");
  }

  await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.33);
  await expect(frame).toHaveScreenshot("phase-one-harness-crosshair.png");
});

test("phase-one harness renders a deterministic zoomed viewport snapshot", async ({ page }) => {
  await page.goto("/");
  const frame = page.locator(".chart-frame");
  const canvas = page.getByLabel("chartx2 phase-one chart harness");
  await expect(canvas).toBeVisible();

  await canvas.evaluate((node) => {
    node.dispatchEvent(new WheelEvent("wheel", { deltaY: -240, bubbles: true, cancelable: true }));
    node.dispatchEvent(new WheelEvent("wheel", { deltaY: -240, bubbles: true, cancelable: true }));
  });

  await expect(frame).toHaveScreenshot("phase-one-harness-zoomed.png");
});
