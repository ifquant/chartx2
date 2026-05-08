# Chartx2 Library Split Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the post-reorganization `chartx2` split so `@chartx2/library` is the single consumer-facing contract, the Tauri example keeps its browser smoke tests without machine-specific paths, and sibling hosts such as `alpha2` can detect stale pre-split imports early.

**Architecture:** Keep `packages/chartx2` as the reusable library package and `examples/tauri-svelte` as the official desktop example app. The example app may use `@chartx2/library/internal` only inside its own demo controller files, because those files are fixtures for proving library behavior. Browser visual tests keep using `/chartx/public`, but that endpoint must resolve the library package entry instead of hardcoding one developer's filesystem path. Active docs and source-facing summaries must name `@chartx2/library` or `packages/chartx2/src/lib/public`; old `src/lib/chartx/public` and `src/lib/demo` references stay only in historical plans/tutorials.

**Tech Stack:** pnpm workspace, Svelte 5, SvelteKit, Tauri 2, TypeScript, Vitest, Playwright

---

## Current Baseline

These checks passed before this plan was written:

- `pnpm check`
- `pnpm build`
- `pnpm test`

Observed test scope:

- `@chartx2/library`: 534 unit tests passed
- `@chartx2/example-tauri-svelte`: 12 unit tests passed
- `@chartx2/example-tauri-svelte`: 195 Playwright visual tests passed

The implementation starts from a green baseline. If the first task fails before code changes, stop and refresh dependencies or test config before editing library code.

## Subagent Slice Map

- Slice A owns package-consumer smoke tests and the `/chartx/public` browser endpoint.
- Slice B owns boundary scanning tests plus active docs/source path cleanup.
- Slice C owns verification, tutorial, and commit.

Do not have two workers edit the same file. If Slice A changes the endpoint contract, Slice B should only consume that resulting path through the static test.

---

### Task 1: Add A Public Package Consumer Smoke Test

**Files:**
- Create: `examples/tauri-svelte/tests/unit/library-public-consumer.test.ts`

- [ ] **Step 1: Create the consumer test**

Create `examples/tauri-svelte/tests/unit/library-public-consumer.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import {
  AccountSyncStatusCard,
  ChartFrameShell,
  PhaseOneMarketChartSurface,
  StrategyTesterPanel,
  TradingTicketPanel,
  WorkbenchHostSurfaceDock,
  createChartxPhaseOneChart,
  getChartxFoundation,
  openWorkbenchSymbol,
  type WorkbenchHostAdapter,
} from "@chartx2/library";

describe("@chartx2/library public consumer boundary", () => {
  it("exports reusable shells and chart helpers from the package barrel", () => {
    expect(ChartFrameShell).toBeDefined();
    expect(PhaseOneMarketChartSurface).toBeDefined();
    expect(StrategyTesterPanel).toBeDefined();
    expect(TradingTicketPanel).toBeDefined();
    expect(AccountSyncStatusCard).toBeDefined();
    expect(WorkbenchHostSurfaceDock).toBeDefined();
    expect(typeof getChartxFoundation).toBe("function");
    expect(typeof createChartxPhaseOneChart).toBe("function");
  });

  it("opens a symbol through the public workbench host adapter contract", async () => {
    const adapter: WorkbenchHostAdapter = {
      listWatchlistItems: vi.fn(async () => []),
      resolveSymbol: vi.fn(async (symbol) => ({
        symbol,
        name: "螺纹钢 2605",
        exchange: "SHFE",
        defaultTimeframe: "1m",
      })),
      loadBars: vi.fn(async (symbol, timeframe) => ({
        symbol,
        timeframe,
        exchangeLabel: "SHFE",
        bars: [
          { time: 1, open: 3700, high: 3718, low: 3695, close: 3712 },
          { time: 2, open: 3712, high: 3724, low: 3708, close: 3719 },
        ],
        volume: [
          { time: 1, value: 812000, color: "#ef4444" },
          { time: 2, value: 643000, color: "#ef4444" },
        ],
        line: [
          { time: 1, value: 3712 },
          { time: 2, value: 3719 },
        ],
      })),
    };

    const result = await openWorkbenchSymbol(adapter, {
      symbol: "rb2605",
      timeframe: "1m",
      source: "host",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe("host");
      expect(result.symbol.symbol).toBe("rb2605");
      expect(result.payload.exchangeLabel).toBe("SHFE");
      expect(result.payload.bars[0]?.close).toBe(3712);
    }
    expect(adapter.resolveSymbol).toHaveBeenCalledWith("rb2605");
    expect(adapter.loadBars).toHaveBeenCalledWith("rb2605", "1m");
  });
});
```

- [ ] **Step 2: Run the new unit gate**

Run:

```sh
pnpm --filter @chartx2/example-tauri-svelte test:unit
```

Expected: PASS with the new consumer test included.

---

### Task 2: Remove The Absolute Public Entrypoint Path

**Files:**
- Modify: `examples/tauri-svelte/src/routes/chartx/public/+server.ts`

- [ ] **Step 1: Replace the machine-specific constant**

Replace the route file with:

```ts
import { fileURLToPath } from "node:url";

import type { RequestHandler } from "./$types";

const publicEntryPath = fileURLToPath(import.meta.resolve("@chartx2/library"));

export const GET: RequestHandler = async () => {
  const moduleSource = `export * from "/@fs/${publicEntryPath}";`;

  return new Response(moduleSource, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};
```

- [ ] **Step 2: Verify the browser import endpoint**

Run the two visual specs that dynamically import `/chartx/public`:

```sh
pnpm --filter @chartx2/example-tauri-svelte exec playwright test tests/visual/phase-one-api.spec.ts tests/visual/phase-one-performance.spec.ts
```

Expected: PASS.

---

### Task 3: Add A Static Split Boundary Test

**Files:**
- Create: `examples/tauri-svelte/tests/unit/library-split-boundary.test.ts`

- [ ] **Step 1: Create the static boundary test**

Create `examples/tauri-svelte/tests/unit/library-split-boundary.test.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

const textExtensions = new Set([".js", ".ts", ".svelte", ".md"]);
const skippedDirectories = new Set([
  ".svelte-kit",
  "build",
  "dist",
  "node_modules",
  "playwright-report",
  "target",
  "test-results",
]);

function repoPath(...segments: string[]): string {
  return path.join(repoRoot, ...segments);
}

function toRepoPath(absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}

function readRepoFile(relativePath: string): string {
  return readFileSync(repoPath(relativePath), "utf8");
}

function listTextFiles(relativeRoot: string): string[] {
  const absoluteRoot = repoPath(relativeRoot);
  if (!existsSync(absoluteRoot)) {
    return [];
  }

  const files: string[] = [];
  const walk = (absoluteDirectory: string) => {
    for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
      const absolutePath = path.join(absoluteDirectory, entry.name);
      if (entry.isDirectory()) {
        if (!skippedDirectories.has(entry.name)) {
          walk(absolutePath);
        }
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      if (textExtensions.has(path.extname(entry.name))) {
        files.push(toRepoPath(absolutePath));
      }
    }
  };

  walk(absoluteRoot);
  return files.sort();
}

describe("chartx2 library split boundary", () => {
  it("keeps active docs and source free of stale pre-split public paths", () => {
    const activeBoundaryFiles = [
      "AGENTS.md",
      "README.md",
      "docs/alpha2-host-integration.md",
      "docs/chart-workstation-architecture.md",
      "docs/phase-one-checklist.md",
      "docs/lightweight-charts-gap-checklist.md",
      "examples/tauri-svelte/src/routes/chartx/public/+server.ts",
      "packages/chartx2/src/lib/internal/foundation.ts",
    ];
    const staleFragments = [
      "/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/index.ts",
      "src/lib/chartx/public",
      "src/lib/demo",
    ];

    for (const relativePath of activeBoundaryFiles) {
      const source = readRepoFile(relativePath);
      for (const staleFragment of staleFragments) {
        expect(
          source,
          `${relativePath} must not contain ${staleFragment}`,
        ).not.toContain(staleFragment);
      }
    }
  });

  it("keeps internal library imports inside example-owned demo controllers", () => {
    const internalImportFiles = listTextFiles("examples/tauri-svelte/src").filter(
      (relativePath) => readRepoFile(relativePath).includes("@chartx2/library/internal"),
    );

    expect(internalImportFiles).toEqual([
      "examples/tauri-svelte/src/lib/example-app/chartx-demo.ts",
      "examples/tauri-svelte/src/lib/example-app/performance-demo.ts",
    ]);
  });
});
```

- [ ] **Step 2: Run the boundary test and keep the first failure**

Run:

```sh
pnpm --filter @chartx2/example-tauri-svelte test:unit
```

Expected after only adding the test: FAIL, because active docs and `foundation.ts` still contain stale path text.

---

### Task 4: Clean Active Path References

**Files:**
- Modify: `docs/alpha2-host-integration.md`
- Modify: `docs/chart-workstation-architecture.md`
- Modify: `docs/phase-one-checklist.md`
- Modify: `docs/lightweight-charts-gap-checklist.md`
- Modify: `packages/chartx2/src/lib/internal/foundation.ts`

- [ ] **Step 1: Update the alpha2 integration guide**

In `docs/alpha2-host-integration.md`, replace the final practical rule:

```md
For now, `alpha2` should treat `chartx2` as:

- public TypeScript contracts from `@chartx2/library`
- reusable Svelte host shells from the same barrel
- host-owned runtime wiring everywhere else

Inside the local workspace, a host may temporarily resolve the package to
`packages/chartx2/src/lib/public` for source-level development, but it should
not import from `examples/tauri-svelte/src/lib/example-app`.
```

- [ ] **Step 2: Update active architecture/checklist docs**

Replace old references:

```text
src/lib/chartx/public
```

with:

```text
packages/chartx2/src/lib/public
```

in these active docs:

```text
docs/chart-workstation-architecture.md
docs/phase-one-checklist.md
docs/lightweight-charts-gap-checklist.md
```

Do not rewrite historical implementation plans or old tutorial files in this slice.

- [ ] **Step 3: Update the internal foundation summary**

In `packages/chartx2/src/lib/internal/foundation.ts`, change `boundarySummary.publicSurface` so the first two entries are:

```ts
publicSurface: [
  "@chartx2/library public barrel backed by packages/chartx2/src/lib/public",
  "host shell reads chartx only through package public entrypoints",
  "createChartxPhaseOneChart exposes a narrow chart API with pane handles, pane options, chart-level pane events with pane snapshots and stable series metadata, pane resize subscriptions, explicit pane targets, pane-aware readout payloads, one primary slot, and controlled multi-series routing inside managed secondary panes",
],
```

- [ ] **Step 4: Re-run the unit gate**

Run:

```sh
pnpm --filter @chartx2/example-tauri-svelte test:unit
```

Expected: PASS.

---

### Task 5: Document The Post-Split Consumer Rule

**Files:**
- Modify: `README.md`
- Create: `tutorials/commit/0372-stabilize-library-split-boundary.md`

- [ ] **Step 1: Add a README consumer note**

Add this section near the workspace layout or command section:

```md
## Consumer Boundary

External hosts should import chart surfaces, models, and helpers from
`@chartx2/library`. The source-backed package entry lives at
`packages/chartx2/src/lib/public`, but hosts should not import the example app.

The example app keeps an internal-only alias for its demo controllers:
`@chartx2/library/internal`. That alias is for `examples/tauri-svelte/src/lib/example-app`
fixtures and browser smoke tests, not for sibling products such as `alpha2`.
```

- [ ] **Step 2: Add the commit tutorial**

Create `tutorials/commit/0372-stabilize-library-split-boundary.md`:

```md
# 0372 Stabilize The Library Split Boundary

This slice locks the post-reorganization consumer rule: hosts import from
`@chartx2/library`, while the official example app can keep demo-only internal
imports inside `examples/tauri-svelte/src/lib/example-app`.

## What Changed

- Added a unit smoke test that consumes reusable shells and workbench helpers
  through `@chartx2/library`.
- Replaced the `/chartx/public` route's machine-specific source path with
  package-entry resolution.
- Added a static split-boundary test for active docs, source summaries, and
  internal import ownership.
- Updated active docs so they name the package boundary instead of the old
  pre-workspace paths.

## Verification

Run:

```sh
pnpm --filter @chartx2/example-tauri-svelte test:unit
pnpm --filter @chartx2/example-tauri-svelte exec playwright test tests/visual/phase-one-api.spec.ts tests/visual/phase-one-performance.spec.ts
pnpm check
pnpm build
pnpm test
```

The focused unit gate catches source and doc boundary drift. The two visual
specs prove the browser-only `/chartx/public` endpoint still works for dynamic
imports used by Playwright.
```

---

### Task 6: Run Final Verification And Commit

**Files:**
- All files changed by Tasks 1-5

- [ ] **Step 1: Run focused gates**

Run:

```sh
pnpm --filter @chartx2/example-tauri-svelte test:unit
pnpm --filter @chartx2/example-tauri-svelte exec playwright test tests/visual/phase-one-api.spec.ts tests/visual/phase-one-performance.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run workspace gates**

Run:

```sh
pnpm check
pnpm build
pnpm test
git diff --check
```

Expected: PASS. The build may print Vite's existing chunk-size warning; that warning is not a failure.

- [ ] **Step 3: Inspect the diff**

Run:

```sh
git status --short
git diff -- examples/tauri-svelte/src/routes/chartx/public/+server.ts
git diff -- examples/tauri-svelte/tests/unit/library-public-consumer.test.ts
git diff -- examples/tauri-svelte/tests/unit/library-split-boundary.test.ts
git diff -- README.md docs/alpha2-host-integration.md packages/chartx2/src/lib/internal/foundation.ts
```

Confirm:

- no `examples/tauri-svelte/src/lib/example-app` file imports `@chartx2/library` public models through old relative paths
- `/chartx/public` remains available for browser tests
- no active docs/source file in the static test allowlist contains old pre-split paths

- [ ] **Step 4: Commit with the required message shape**

Use:

```sh
git add \
  README.md \
  docs/alpha2-host-integration.md \
  docs/chart-workstation-architecture.md \
  docs/phase-one-checklist.md \
  docs/lightweight-charts-gap-checklist.md \
  examples/tauri-svelte/src/routes/chartx/public/+server.ts \
  examples/tauri-svelte/tests/unit/library-public-consumer.test.ts \
  examples/tauri-svelte/tests/unit/library-split-boundary.test.ts \
  packages/chartx2/src/lib/internal/foundation.ts \
  tutorials/commit/0372-stabilize-library-split-boundary.md
git commit -m "test(chartx2-boundary): stabilize library split consumer contract" -m "Lock the post-reorganization boundary so hosts consume chartx2 through the package public barrel while the example app keeps its browser import smoke tests without machine-specific paths." -m "Changes:
- add package-consumer and static split-boundary unit tests
- resolve the /chartx/public endpoint from @chartx2/library instead of a local absolute path
- update active docs and foundation summary to name the workspace package boundary
- document the internal alias rule for example-owned demo controllers

Verification:
- pnpm --filter @chartx2/example-tauri-svelte test:unit (PASS)
- pnpm --filter @chartx2/example-tauri-svelte exec playwright test tests/visual/phase-one-api.spec.ts tests/visual/phase-one-performance.spec.ts (PASS)
- pnpm check (PASS)
- pnpm build (PASS)
- pnpm test (PASS)
- git diff --check (PASS)

Not included:
- npm publishing for @chartx2/library
- moving demo controllers out of examples/tauri-svelte/src/lib/example-app"
```

---

## Completion Criteria

- `@chartx2/library` has an example-package consumer test that imports package exports directly.
- `/chartx/public` no longer stores a developer-specific absolute path in source.
- Active docs and live source summaries use `@chartx2/library` or `packages/chartx2/src/lib/public`.
- Internal imports are fenced to example-owned demo controller files.
- Full workspace verification passes after the split-boundary cleanup.

## Not Included

- Publishing `@chartx2/library` to a public registry.
- Replacing the browser-only `/chartx/public` smoke-test endpoint with an import map.
- Moving demo runtime fixtures into the library package.
- Changing `alpha2` again; this plan only makes `chartx2` safer for `alpha2` to consume.
