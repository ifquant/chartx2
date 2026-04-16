import { expect, test } from "@playwright/test";

test("performance report renders the first-slice canvas board", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Performance", exact: true }).click();

  const report = page.locator('[data-demo-tab="performance"]');
  await expect(report).toBeVisible();
  await expect(page.getByLabel("chartx2 performance report canvas")).toBeVisible();
  await expect(report).toContainText("Net profit");
  await expect(report).toContainText("Trade Intent");
  await expect(report).toContainText("T-001");
});

test("performance report emits a trade location intent from trade row selection", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Performance", exact: true }).click();

  const canvas = page.getByLabel("chartx2 performance report canvas");
  const report = page.locator('[data-demo-tab="performance"]');
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("performance report canvas is missing");
  }

  await page.mouse.click(box.x + box.width - 190, box.y + 302);

  await expect(report).toContainText("T-006");
  await expect(report).toContainText("performance-report-demo");
  await expect(report).toContainText("selected trade T-006");
});

test("performance report emits a trade location intent from equity point selection", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Performance", exact: true }).click();

  const canvas = page.getByLabel("chartx2 performance report canvas");
  const report = page.locator('[data-demo-tab="performance"]');
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("performance report canvas is missing");
  }

  const tableWidth = Math.min(390, Math.max(280, box.width * 0.32));
  const equityPointX = box.x + box.width - tableWidth - 56;
  const equityPointY = box.y + 146;
  await page.mouse.click(equityPointX, equityPointY);

  await expect(report).toContainText("T-018");
  await expect(report).toContainText("selected trade T-018");
});
