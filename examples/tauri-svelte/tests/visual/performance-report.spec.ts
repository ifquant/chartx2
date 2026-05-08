import { expect, test, type Page } from "@playwright/test";

function performanceTopTab(page: Page) {
  return page.getByLabel("chartx2 demo tabs").getByRole("button", {
    name: "Performance",
    exact: true,
  });
}

test("performance report renders the first-slice canvas board", async ({ page }) => {
  await page.goto("/");
  await performanceTopTab(page).click();

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
  await performanceTopTab(page).click();
  await page.getByLabel("View").selectOption("heatmap");

  const canvas = page.getByLabel("chartx2 optimization surface canvas");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("optimization surface canvas is missing");
  }

  const plot = {
    x: box.x + 70,
    y: box.y + 60,
    width: box.width - 102,
    height: box.height - 94,
  };
  const cellWidth = plot.width / 9;
  const cellHeight = plot.height / 10;
  const target = {
    x: plot.x + cellWidth * 1.5,
    y: plot.y + plot.height - cellHeight * 0.5,
  };
  await page.mouse.click(target.x, target.y);

  const report = page.locator('[data-demo-tab="performance"]');
  await expect(report).toContainText("selected run sweep-run-051");
  await expect(report).toContainText("sweep-run-051");
});

test("optimization surface can switch into 3d scatter mode", async ({ page }) => {
  await page.goto("/");
  await performanceTopTab(page).click();

  await page.getByLabel("View").selectOption("scatter-3d");

  const report = page.locator('[data-demo-tab="performance"]');
  await expect(report).toContainText("changed surface mode to scatter-3d");
  await expect(report).toContainText("Drag inside the surface to rotate the 3D camera.");
});

test("performance trade row selection auto-switches to the workbench with the selected trade", async ({
  page,
}) => {
  await page.goto("/");
  await performanceTopTab(page).click();

  const canvas = page.getByLabel("chartx2 performance report canvas");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("performance report canvas is missing");
  }

  await page.mouse.click(box.x + box.width - 190, box.y + 302);

  const workbench = page.locator('[data-demo-tab="workbench"]');
  await expect(workbench).toBeVisible();
  await expect(workbench).toContainText("located trade T-002");
});

test("performance trade intent auto-switches to the workbench and locates the trade", async ({
  page,
}) => {
  await page.goto("/");
  await performanceTopTab(page).click();

  const canvas = page.getByLabel("chartx2 performance report canvas");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("performance report canvas is missing");
  }

  await page.mouse.click(box.x + box.width - 190, box.y + 302);

  const workbench = page.locator('[data-demo-tab="workbench"]');
  await expect(workbench).toBeVisible();
  await expect(workbench).toContainText("located trade T-002");
});
