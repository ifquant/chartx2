import { expect, test } from "@playwright/test";

test("performance report renders the first-slice canvas board", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Performance", exact: true }).click();

  const report = page.locator('[data-demo-tab="performance"]');
  await expect(report).toBeVisible();
  await expect(page.getByLabel("chartx2 optimization surface canvas")).toBeVisible();
  await expect(page.getByLabel("chartx2 performance report canvas")).toBeVisible();
  await expect(report).toContainText("Net profit");
  await expect(report).toContainText("Run Intent");
  await expect(report).toContainText("sweep-run-001");
});

test("optimization heatmap selection switches the performance report to the selected run", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Performance", exact: true }).click();

  const canvas = page.getByLabel("chartx2 optimization surface canvas");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("optimization surface canvas is missing");
  }

  await page.mouse.click(box.x + 110, box.y + 102);

  const report = page.locator('[data-demo-tab="performance"]');
  await expect(report).toContainText("selected run sweep-run-007");
  await expect(report).toContainText("sweep-run-007");
});

test("performance trade row selection auto-switches to the workbench with the selected trade", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Performance", exact: true }).click();

  const canvas = page.getByLabel("chartx2 performance report canvas");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("performance report canvas is missing");
  }

  await page.mouse.click(box.x + box.width - 190, box.y + 302);

  const workbench = page.locator('[data-demo-tab="workbench"]');
  await expect(workbench).toBeVisible();
  await expect(workbench).toContainText("located trade T-006");
});

test("performance trade intent auto-switches to the workbench and locates the trade", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Performance", exact: true }).click();

  const canvas = page.getByLabel("chartx2 performance report canvas");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("performance report canvas is missing");
  }

  await page.mouse.click(box.x + box.width - 190, box.y + 302);

  const workbench = page.locator('[data-demo-tab="workbench"]');
  await expect(workbench).toBeVisible();
  await expect(workbench).toContainText("located trade T-006");
});
