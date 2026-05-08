# Chartx2 Library-First Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `chartx2` so the repo is centered on a pure reusable chart library package, while the current `Tauri + SvelteKit` application is moved into `examples/tauri-svelte` as a concrete usage example.

**Architecture:** Convert the repo into a small pnpm workspace with one library package and one example app. The library package owns chart engine internals, public contracts, reusable Svelte shells, and packaging/export rules. The example app owns only app shell, demo composition, Tauri host wiring, and visual/manual showcase flows. Compatibility is preserved through a deliberate migration layer instead of leaving demo paths mixed into public exports.

**Tech Stack:** pnpm workspace, Svelte 5, SvelteKit, Tauri 2, TypeScript, Vitest, Playwright, Rust

---

## File Structure Lock

Target repo layout after this plan:

```text
chartx2/
├─ package.json                      # workspace root only
├─ pnpm-workspace.yaml
├─ packages/
│  └─ chartx2/
│     ├─ package.json
│     ├─ svelte.config.js
│     ├─ tsconfig.json
│     ├─ src/lib/
│     │  ├─ public/
│     │  ├─ internal/
│     │  ├─ ui/
│     │  └─ examples/
│     └─ tests/
│        └─ unit/
├─ examples/
│  └─ tauri-svelte/
│     ├─ package.json
│     ├─ svelte.config.js
│     ├─ src/
│     ├─ src-tauri/
│     └─ tests/
│        └─ visual/
└─ docs/
```

Rules this plan locks in:

- `packages/chartx2` is the only place that may own reusable chart engine, public contracts, and reusable chart-adjacent Svelte UI.
- `examples/tauri-svelte` is allowed to own app shell, routes, Tauri host bootstrap, demo/runtime fixtures, and visual flows.
- No reusable public component may continue exporting from a `demo/components` path after the reorg.
- `chartx2` root should stop pretending to be the app itself; it becomes a workspace/documentation root.

## Scope Check

This is one subsystem plan, not multiple unrelated plans. Every task serves the same outcome:

- turn `chartx2` into a library-first repo
- keep one official example app
- preserve current runtime and host integration behavior while separating ownership cleanly

This plan does **not** include:

- npm publishing
- splitting Rust into a separate crate or repo
- redesigning chart runtime behavior
- removing the example app

---

### Task 1: Convert The Repo Root Into A Workspace Shell

**Files:**
- Create: `pnpm-workspace.yaml`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Test: `examples/tauri-svelte/package.json`

- [ ] **Step 1: Write the failing structure test as a checklist gate**

Create this temporary structural expectation in the plan notes before coding:

```text
Expected after Task 1:
- root package.json no longer acts as the runnable app package
- pnpm workspace declares packages/chartx2 and examples/tauri-svelte
- root README describes workspace roles, not app runtime details
```

- [ ] **Step 2: Add the workspace file**

Create `pnpm-workspace.yaml` with:

```yaml
packages:
  - "packages/*"
  - "examples/*"
```

- [ ] **Step 3: Rewrite the root package.json into a workspace orchestrator**

Replace the root `package.json` with a workspace-oriented shell like:

```json
{
  "name": "chartx2-workspace",
  "private": true,
  "version": "0.1.0",
  "packageManager": "pnpm@10",
  "scripts": {
    "check": "pnpm -r check",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "test:unit": "pnpm --filter @chartx2/library test:unit",
    "test:visual": "pnpm --filter @chartx2/example-tauri-svelte test:visual"
  }
}
```

- [ ] **Step 4: Update README to describe root/workspace roles**

Add a top-level layout section like:

```md
## Workspace Layout

- `packages/chartx2`
  - reusable chart library package
- `examples/tauri-svelte`
  - official desktop example app using the library
```

- [ ] **Step 5: Update AGENTS.md to lock the new boundary**

Add explicit rules:

```md
- `packages/chartx2` owns reusable chart engine, public contracts, and reusable UI shells
- `examples/tauri-svelte` owns demo composition, routes, and Tauri host wiring
- do not export public components from `examples/`
```

- [ ] **Step 6: Run the workspace root checks**

Run:

```bash
pnpm install
pnpm check
```

Expected:

```text
Workspace resolves both package targets without path errors
```

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml package.json README.md AGENTS.md
git commit -m "refactor(workspace): convert chartx2 root into a library-first workspace shell"
```

---

### Task 2: Create The Pure Library Package Skeleton

**Files:**
- Create: `packages/chartx2/package.json`
- Create: `packages/chartx2/svelte.config.js`
- Create: `packages/chartx2/tsconfig.json`
- Create: `packages/chartx2/src/lib/public/index.ts`
- Create: `packages/chartx2/src/lib/internal/.gitkeep`
- Create: `packages/chartx2/src/lib/ui/.gitkeep`
- Create: `packages/chartx2/tests/unit/.gitkeep`
- Test: `packages/chartx2/package.json`

- [ ] **Step 1: Create the library package manifest**

Create `packages/chartx2/package.json`:

```json
{
  "name": "@chartx2/library",
  "version": "0.1.0",
  "type": "module",
  "svelte": "./src/lib/public/index.ts",
  "exports": {
    ".": {
      "types": "./src/lib/public/index.ts",
      "svelte": "./src/lib/public/index.ts",
      "default": "./src/lib/public/index.ts"
    }
  },
  "scripts": {
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "build": "vite build",
    "test": "pnpm test:unit",
    "test:unit": "vitest run tests/unit"
  }
}
```

- [ ] **Step 2: Add local Svelte config for the package**

Create `packages/chartx2/svelte.config.js`:

```js
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess()
};

export default config;
```

- [ ] **Step 3: Add a strict package-local tsconfig**

Create `packages/chartx2/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "baseUrl": "."
  }
}
```

- [ ] **Step 4: Create the new library entrypoint**

Create `packages/chartx2/src/lib/public/index.ts`:

```ts
// library barrel placeholder; actual exports migrate in Task 3
export {};
```

- [ ] **Step 5: Run package-local check to verify the skeleton is loadable**

Run:

```bash
pnpm --filter @chartx2/library check
```

Expected:

```text
svelte-check starts from packages/chartx2 without missing-config failures
```

- [ ] **Step 6: Commit**

```bash
git add packages/chartx2
git commit -m "feat(library): add the initial pure chartx2 package skeleton"
```

---

### Task 3: Move Engine And Public Contracts Into The Library Package

**Files:**
- Move: `src/lib/chartx/internal/**/*` -> `packages/chartx2/src/lib/internal/**/*`
- Move: `src/lib/chartx/public/**/*` -> `packages/chartx2/src/lib/public/**/*`
- Modify: `packages/chartx2/src/lib/public/index.ts`
- Modify: `tests/unit/**/*`
- Test: `packages/chartx2/tests/unit/public-index-contract.test.ts`

- [ ] **Step 1: Move the internal engine tree without changing behavior**

Move:

```text
src/lib/chartx/internal -> packages/chartx2/src/lib/internal
```

Keep directory names stable. Do not redesign the runtime here.

- [ ] **Step 2: Move the public contract tree**

Move:

```text
src/lib/chartx/public -> packages/chartx2/src/lib/public
```

Then fix imports so package-local public files resolve internal modules by relative package paths instead of app-root aliases.

- [ ] **Step 3: Rebuild the library barrel**

Update `packages/chartx2/src/lib/public/index.ts` to export the moved public modules:

```ts
export * from "./chart-frame-surface";
export * from "./market";
export * from "./market-chart-surface";
export * from "./market-panel-surface";
export * from "./performance";
export * from "./account-sync-surface";
export * from "./host-shell-components";
export * from "./sharing-surface";
export * from "./strategy-tester";
export * from "./trading-ledger-surface";
export * from "./trading-surface";
export * from "./workbench";
export * from "./workbench-alerts";
export * from "./workbench-host";
export * from "./workbench-indicators";
export * from "./workbench-layout";
export * from "./workbench-scripts";
```

- [ ] **Step 4: Move or retarget unit tests to the library package**

Rules:

- unit tests for public/internal engine modules move under `packages/chartx2/tests/unit`
- tests should import from the package-local moved files, not the old root paths

Representative command update:

```bash
pnpm --filter @chartx2/library test:unit
```

- [ ] **Step 5: Run the library unit gate**

Run:

```bash
pnpm --filter @chartx2/library test:unit
pnpm --filter @chartx2/library check
```

Expected:

```text
The public barrel and internal engine compile from packages/chartx2 without depending on the app routes tree
```

- [ ] **Step 6: Commit**

```bash
git add packages/chartx2 src/lib/chartx tests/unit
git commit -m "refactor(library): move engine and public contracts into the chartx2 package"
```

---

### Task 4: Move Reusable Svelte Shells Out Of Demo Paths

**Files:**
- Move: `src/lib/demo/components/ChartFrameShell.svelte` -> `packages/chartx2/src/lib/ui/ChartFrameShell.svelte`
- Move: `src/lib/demo/components/MarketPanelShell.svelte` -> `packages/chartx2/src/lib/ui/MarketPanelShell.svelte`
- Move: `src/lib/demo/components/PhaseOneMarketChartSurface.svelte` -> `packages/chartx2/src/lib/ui/PhaseOneMarketChartSurface.svelte`
- Move: `src/lib/demo/components/ShareDialogShell.svelte` -> `packages/chartx2/src/lib/ui/ShareDialogShell.svelte`
- Move: `src/lib/demo/components/TradingTicketPanel.svelte` -> `packages/chartx2/src/lib/ui/TradingTicketPanel.svelte`
- Move: `src/lib/demo/components/TradingLedgerPanel.svelte` -> `packages/chartx2/src/lib/ui/TradingLedgerPanel.svelte`
- Move: `src/lib/demo/components/StrategyTesterPanel.svelte` -> `packages/chartx2/src/lib/ui/StrategyTesterPanel.svelte`
- Move: `src/lib/demo/components/AccountSyncStatusCard.svelte` -> `packages/chartx2/src/lib/ui/AccountSyncStatusCard.svelte`
- Move: summary/dock components from `src/lib/demo/components/*` -> `packages/chartx2/src/lib/ui/*`
- Modify: `packages/chartx2/src/lib/public/host-shell-components.ts`

- [ ] **Step 1: Create a library-owned UI directory**

Target:

```text
packages/chartx2/src/lib/ui/
```

Purpose:

- reusable Svelte shells stop exporting from `demo/components`
- public components live in the library package beside contracts, not beside the example runtime

- [ ] **Step 2: Move public host shells and summary components**

Move the current public-facing UI components into `packages/chartx2/src/lib/ui/`.

Do **not** move these as-is into `examples/`; they are public library surfaces.

- [ ] **Step 3: Rebuild the host component barrel against library-owned UI**

Update `packages/chartx2/src/lib/public/host-shell-components.ts`:

```ts
export { default as ChartFrameShell } from "../ui/ChartFrameShell.svelte";
export { default as MarketPanelShell } from "../ui/MarketPanelShell.svelte";
export { default as PhaseOneMarketChartSurface } from "../ui/PhaseOneMarketChartSurface.svelte";
export { default as ShareDialogShell } from "../ui/ShareDialogShell.svelte";
export { default as TradingTicketPanel } from "../ui/TradingTicketPanel.svelte";
```

Continue for all current host-facing components.

- [ ] **Step 4: Keep example-only shells out of the public barrel**

These should stay example-owned unless separately promoted:

- `FeatureDemoPanel.svelte`
- `MarketWorkbenchPanel.svelte`
- `PerformanceWorkbenchPanel.svelte`
- `ReplayPanel.svelte`
- fixture-only builders

- [ ] **Step 5: Run public barrel smoke tests**

Run:

```bash
pnpm --filter @chartx2/library test:unit
pnpm --filter @chartx2/library check
```

Expected:

```text
public-index-contract and host shell imports still compile after removing demo-path exports
```

- [ ] **Step 6: Commit**

```bash
git add packages/chartx2/src/lib/ui packages/chartx2/src/lib/public
git commit -m "refactor(library-ui): move reusable host shells out of demo component paths"
```

---

### Task 5: Create The Official Example App And Move The Current Tauri/Svelte Shell Into It

**Files:**
- Create: `examples/tauri-svelte/package.json`
- Create: `examples/tauri-svelte/svelte.config.js`
- Create: `examples/tauri-svelte/tsconfig.json`
- Move: `src/routes/**/*` -> `examples/tauri-svelte/src/routes/**/*`
- Move: `src-tauri/**/*` -> `examples/tauri-svelte/src-tauri/**/*`
- Move: `src/lib/demo/**/*` -> `examples/tauri-svelte/src/lib/demo/**/*`
- Modify: imports in `examples/tauri-svelte/src/routes/+page.svelte`
- Modify: `examples/tauri-svelte/src/lib/demo/chartx-demo.ts`

- [ ] **Step 1: Create the example app package**

Create `examples/tauri-svelte/package.json`:

```json
{
  "name": "@chartx2/example-tauri-svelte",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "test": "pnpm test:unit && pnpm test:visual",
    "test:unit": "vitest run",
    "test:visual": "playwright test",
    "tauri": "tauri"
  },
  "dependencies": {
    "@chartx2/library": "workspace:*"
  }
}
```

- [ ] **Step 2: Move the app shell**

Move:

```text
src/routes -> examples/tauri-svelte/src/routes
src-tauri -> examples/tauri-svelte/src-tauri
src/lib/demo -> examples/tauri-svelte/src/lib/demo
```

Keep the current runtime behavior intact.

- [ ] **Step 3: Rewire app imports to consume the library package**

Example route imports should move from:

```ts
import { getChartxFoundation } from "$lib/chartx/public/market";
import { mountWorkbenchDemo } from "$lib/demo/chartx-demo";
```

to:

```ts
import { getChartxFoundation } from "@chartx2/library";
import { mountWorkbenchDemo } from "$lib/demo/chartx-demo";
```

Rule:

- reusable chart contracts/components come from `@chartx2/library`
- example runtime fixtures keep importing from example-local `src/lib/demo`

- [ ] **Step 4: Preserve Tauri-only ownership in the example**

The example app keeps:

- `src/routes/+page.svelte`
- `src-tauri/*`
- runtime fixture builders
- Playwright visual harnesses

The library does **not** own:

- routes
- menu/app shell
- Tauri command registration

- [ ] **Step 5: Run the example app gates**

Run:

```bash
pnpm --filter @chartx2/example-tauri-svelte check
pnpm --filter @chartx2/example-tauri-svelte build
```

Expected:

```text
The example app compiles while importing public surfaces from @chartx2/library
```

- [ ] **Step 6: Commit**

```bash
git add examples/tauri-svelte src/routes src-tauri src/lib/demo
git commit -m "refactor(example): move the current tauri svelte app into examples/tauri-svelte"
```

---

### Task 6: Split Verification, Docs, And Compatibility Notes Around The New Boundary

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/alpha2-host-integration.md`
- Modify: `docs/alpha2-host-surface-readiness.md`
- Modify: `docs/tradingview-alignment-plan.md`
- Modify: visual test paths under `examples/tauri-svelte/tests/visual/*`
- Modify: unit test paths under `packages/chartx2/tests/unit/*`

- [ ] **Step 1: Rewrite commands and ownership docs**

Update docs to reflect:

```md
- root = workspace/documentation/orchestration
- packages/chartx2 = library
- examples/tauri-svelte = official desktop example
```

- [ ] **Step 2: Rewrite host integration docs around the package import**

Replace import examples like:

```ts
import { ShareDialogShell } from "$lib/chartx/public";
```

with:

```ts
import { ShareDialogShell } from "@chartx2/library";
```

- [ ] **Step 3: Split test ownership**

Rules:

- package unit tests live under `packages/chartx2/tests/unit`
- example visual tests live under `examples/tauri-svelte/tests/visual`
- example-local demo runtime tests stay with the example

- [ ] **Step 4: Add a migration note for temporary compatibility**

Document any temporary transitional rule, for example:

```md
During the reorg, root-level import paths are compatibility-only and should be removed once the example app and alpha2 both consume @chartx2/library directly.
```

- [ ] **Step 5: Run the full workspace verification**

Run:

```bash
pnpm test
pnpm build
git diff --check
```

Expected:

```text
library unit tests pass, example visual tests pass, and the example app still builds from the workspace package
```

- [ ] **Step 6: Commit**

```bash
git add README.md AGENTS.md docs examples/tauri-svelte/tests packages/chartx2/tests
git commit -m "docs(workspace): align docs and verification with the library-first chartx2 layout"
```

---

## Self-Review

### 1. Spec coverage

Requested outcomes:

- pure chart library as one part
- current Tauri + Svelte app as a usage example
- library-centered repo organization
- `examples` folder with Tauri + Svelte example

Coverage:

- Task 1 establishes workspace root and role split
- Task 2 creates the pure library package
- Task 3 moves engine/public contracts into the library package
- Task 4 moves reusable UI shells into the library package
- Task 5 creates `examples/tauri-svelte` and moves the current app into it
- Task 6 aligns docs/tests with the new ownership

No spec gaps remain for this phase.

### 2. Placeholder scan

Checked for:

- `TODO`
- `TBD`
- “appropriate error handling”
- “similar to”

None intentionally left in the task body.

### 3. Type consistency

Naming used consistently:

- `packages/chartx2`
- `examples/tauri-svelte`
- `@chartx2/library`
- `public`, `internal`, `ui`, `demo`

No conflicting package names or alternate directory names are used later in the plan.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-08-chartx2-library-first-reorg.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
