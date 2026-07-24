import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseRoot = "/Users/dev/workspace2/hc_apps/build/chartx2";

function newestLocalTarball() {
  const tarballs = readdirSync(releaseRoot)
    .filter((entry) => entry.startsWith("chartx2-library-") && entry.endsWith(".tgz"))
    .map((entry) => {
      const tarballPath = path.join(releaseRoot, entry);
      return { entry, path: tarballPath, mtimeMs: statSync(tarballPath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs || left.entry.localeCompare(right.entry));

  if (tarballs.length === 0) throw new Error(`No chartx2 library tarball found in ${releaseRoot}`);
  return tarballs[0].path;
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: "inherit", ...options });
}

const consumerRoot = mkdtempSync(path.join(tmpdir(), "chartx2-release-consumer-"));

try {
  run("node", [path.join(repoRoot, "scripts/pack-chartx2-local-release.mjs")], { cwd: repoRoot });
  const tarballPath = newestLocalTarball();

  writeFileSync(path.join(consumerRoot, "package.json"), JSON.stringify({
    name: "chartx2-local-release-consumer-smoke",
    private: true,
    type: "module",
    dependencies: {
      "@chartx2/library": `file:${tarballPath}`,
      "@playwright/test": "1.58.2",
      "@sveltejs/vite-plugin-svelte": "5.1.1",
      svelte: "5.55.1",
      typescript: "5.6.3",
      vite: "6.4.1",
    },
  }, null, 2) + "\n");

  // This directory is intentionally outside the workspace: every import below must
  // resolve through the packed tarball and this consumer's own dependencies.
  run("pnpm", ["install", "--ignore-scripts", "--reporter", "append-only"], { cwd: consumerRoot });
  run("pnpm", ["exec", "playwright", "install", "chromium"], { cwd: consumerRoot });

  writeFileSync(path.join(consumerRoot, "type-probe.ts"), `
import { ChartFrameShell, type PhaseOneTimeFocusResult, type PhaseOneTimeScaleApi } from "@chartx2/library";
import { WorkbenchDrawingInspectorPanel } from "@chartx2/library/workbench-drawing-inspector";

function describeFocusResult(result: PhaseOneTimeFocusResult): string {
  switch (result.kind) {
    case "exact": return result.resolvedTime.toString();
    case "nearest": return result.distance.toString();
    case "outOfDomain": return result.reason;
    case "ambiguous": return result.resolvedTime.toString();
    case "noData": return result.requestedTime.toString();
    default: {
      const impossible: never = result;
      return impossible;
    }
  }
}

const timeScale = {
  getVisibleLogicalRange: () => null,
  setVisibleLogicalRange: (_range: { from: number; to: number }) => undefined,
  focusTime: (_request: { time: number; maxDistance: number }): PhaseOneTimeFocusResult => ({ kind: "noData", requestedTime: 0 }),
  applyOptions: () => undefined,
} satisfies PhaseOneTimeScaleApi;

void ChartFrameShell;
void WorkbenchDrawingInspectorPanel;
void describeFocusResult(timeScale.focusTime({ time: 0, maxDistance: 0 }));
void timeScale;
`);
  writeFileSync(path.join(consumerRoot, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      module: "ESNext", moduleResolution: "Bundler", noEmit: true, skipLibCheck: true,
      strict: true, target: "ES2022", types: ["svelte"],
    },
    include: ["type-probe.ts"],
  }, null, 2) + "\n");
  run("pnpm", ["exec", "tsc", "--noEmit"], { cwd: consumerRoot });

  writeFileSync(path.join(consumerRoot, "index.html"), '<canvas id="chart" width="640" height="360"></canvas><canvas id="empty" width="640" height="360"></canvas><script type="module" src="/runtime.js"></script>\n');
  writeFileSync(path.join(consumerRoot, "runtime.js"), `
import { ChartFrameShell, createChartxPhaseOneChart } from "@chartx2/library";
import { WorkbenchDrawingInspectorPanel } from "@chartx2/library/workbench-drawing-inspector";

if (!ChartFrameShell) throw new Error("root package lost an existing public export");
if (!WorkbenchDrawingInspectorPanel) throw new Error("focused inspector public subpath is unavailable");
const chart = createChartxPhaseOneChart(document.querySelector("#chart"));
const series = chart.addCandlestickSeries();
series.setData([
  { time: 100, open: 10, high: 12, low: 9, close: 11 },
  { time: 200, open: 11, high: 13, low: 10, close: 12 },
  { time: 300, open: 12, high: 14, low: 11, close: 13 },
]);
const timeScale = chart.timeScale();
const beforeRejected = timeScale.getVisibleLogicalRange();
const beforeFirst = timeScale.focusTime({ time: 99, maxDistance: 1000 });
const afterRejected = timeScale.getVisibleLogicalRange();
const results = {
  exact: timeScale.focusTime({ time: 200, maxDistance: 0 }),
  nearest: timeScale.focusTime({ time: 205, maxDistance: 5 }),
  beforeFirst,
  maxDistance: timeScale.focusTime({ time: 206, maxDistance: 5 }),
  rejectedRangeStable: JSON.stringify(beforeRejected) === JSON.stringify(afterRejected),
};
chart.destroy();
const empty = createChartxPhaseOneChart(document.querySelector("#empty"));
results.noData = empty.timeScale().focusTime({ time: 100, maxDistance: 0 });
empty.destroy();
window.__chartx2PackedProbe = results;
`);
  writeFileSync(path.join(consumerRoot, "probe.mjs"), `
import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const server = await createServer({
  root: process.cwd(),
  logLevel: "error",
  plugins: [svelte()],
  server: { host: "127.0.0.1" },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "networkidle" });
  const results = await page.evaluate(() => window.__chartx2PackedProbe);
  if (results.exact.kind !== "exact" || results.nearest.kind !== "nearest") throw new Error("packed focus success cases failed");
  if (results.beforeFirst.kind !== "outOfDomain" || results.beforeFirst.reason !== "beforeFirst") throw new Error("packed before-first handling failed");
  if (results.maxDistance.kind !== "outOfDomain" || results.maxDistance.reason !== "maxDistanceExceeded") throw new Error("packed max-distance handling failed");
  if (results.noData.kind !== "noData" || !results.rejectedRangeStable) throw new Error("packed rejected focus changed viewport or no-data handling failed");
} finally {
  await browser?.close();
  await server.close();
}
`);
  run("node", ["probe.mjs"], { cwd: consumerRoot });
  console.log(`Verified chartx2 packed browser consumer: ${tarballPath}`);
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}
