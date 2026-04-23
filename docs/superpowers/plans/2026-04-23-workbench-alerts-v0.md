# Workbench Alerts V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Each task must be committed separately and reviewed by independent spec and code-quality reviewers.

## Goal

Add the first local Workbench alert capability without mixing alert state into chart layout state or chart runtime internals.

Alerts V0 is intentionally narrow:

- versioned public alert state
- localStorage-backed alert provider
- price-cross alert creation for the active workbench symbol
- deterministic sidebar projection
- browser coverage for creating and persisting a local alert

Do not implement drawing alerts, indicator alerts, cloud alerts, notification delivery, condition editing, alert deletion, or broker/order behavior in this slice.

## Architecture

Alerts are workstation state, not chart layout state.

The saved layout contract remains responsible for symbol/timeframe/chart snapshot/panel state. Alerts get their own public module and provider, mirroring the `workbench-layout.ts` pattern:

- `src/lib/chartx/public/workbench-alerts.ts`
- `tests/unit/workbench-alerts.test.ts`

The existing `AlertSummaryModel` remains the sidebar projection model. Persisted alert records should map into it through an explicit helper instead of making the sidebar summary the source of truth.

## Task 1: Public Alert State And Local Provider

Files:

- Create `src/lib/chartx/public/workbench-alerts.ts`
- Modify `src/lib/chartx/public/index.ts`
- Add `tests/unit/workbench-alerts.test.ts`

Implementation requirements:

- Add `WorkbenchAlertStatus = "armed" | "paused" | "triggered"`.
- Add V1 price-cross condition:
  - `kind: "price-crosses"`
  - `symbol`
  - `timeframe`
  - `price`
  - `direction: "above" | "below" | "either"`
- Add `WorkbenchAlertStateV1` with `id`, `label`, `condition`, `status`, `createdAt`, `updatedAt`, and optional `triggeredAt`.
- Add `WorkbenchAlertsStateV1` with `kind: "workbench-alerts"`, `version: 1`, and `alerts`.
- Add `createWorkbenchAlertsState({ alerts })`.
- Add `isWorkbenchAlertsState(value)`.
- Add `toAlertSummaryModel(alert): AlertSummaryModel`.
- Add `createLocalStorageWorkbenchAlertsProvider(storage, key?)`.
- Export the new module from `src/lib/chartx/public/index.ts`.

Validation requirements:

- Reject unknown kind/version.
- Reject non-array alerts.
- Reject empty `id`, `label`, `symbol`, or `timeframe`.
- Reject non-finite `price`, `createdAt`, `updatedAt`, or `triggeredAt`.
- Reject invalid status or direction.
- Treat corrupt JSON and invalid stored shape as `null`.
- Return `false` on save failure.
- Ignore clear failure.

Tests:

- Factory creates a valid V1 state.
- Summary projection formats a price-cross alert into current sidebar fields.
- Validator rejects malformed version, alert shape, status, direction, price, and timestamps.
- Local provider saves, loads, clears, rejects bad JSON, rejects invalid shape, and tolerates storage exceptions.

Verification:

- `pnpm test:unit -- tests/unit/workbench-alerts.test.ts`
- `git diff --check`

## Task 2: Demo Controller Alert Runtime

Files:

- Modify `src/lib/demo/chartx-demo.ts`
- Modify `tests/unit/workbench-alerts.test.ts` if useful for pure helper coverage

Implementation requirements:

- Extend `WorkbenchDemoOptions` with optional `alertsProvider`.
- Extend `DemoController` with `createPriceAlert?(): Promise<boolean>`.
- Keep an in-memory `WorkbenchAlertState[]` list in the controller.
- On mount, load alerts from `alertsProvider` when provided; otherwise seed deterministic demo alerts through V1 alert records.
- Project alerts into `createChartWorkbenchModel({ alertItems })` using `toAlertSummaryModel`.
- Implement `createPriceAlert`:
  - create an armed price-cross alert for `activeSymbol` and `activeTimeframe`
  - use the latest active payload close as the base price
  - make the target deterministic, for example latest close rounded plus a small offset
  - save through `alertsProvider` when provided
  - publish a log like `created alert <symbol> price crosses <price>`
- Add a narrow evaluation helper or controller path that marks an armed alert as `triggered` when active payload/latest close satisfies the condition after symbol open or alert creation.
- Do not reach into `chart-harness` or internal chart runtime for alert evaluation.

Verification:

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-alerts.test.ts`
- `git diff --check`

## Task 3: Svelte Alert Button And Browser Flow

Files:

- Modify `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify `src/routes/+page.svelte`
- Modify `tests/visual/phase-one-harness.spec.ts`

Implementation requirements:

- Add an `onCreatePriceAlert` prop to `MarketWorkbenchPanel`.
- Wire the Alerts card `+` button to that prop.
- Keep the page shell thin: add a handler that calls `workbenchController.createPriceAlert?.()`.
- Add visual/browser coverage that:
  - starts from the Workbench page
  - clicks the Alerts `+` button
  - verifies a new active-symbol price alert appears in the Alerts card
  - verifies the activity log records alert creation
- Scope selectors to the Alerts card to avoid false positives from other sidebar cards.

Verification:

- `pnpm check`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench creates a price alert"`
- `git diff --check`

## Task 4: Docs, Tutorial, And Final Verification

Files:

- Modify `docs/tradingview-alignment-plan.md`
- Create `tutorials/commit/0280-add-workbench-alerts-v0.md`

Documentation requirements:

- Add an implementation note under `Layer 2: Workstation Parity > Alerts V0`.
- Tutorial should explain why alerts are separate from layout, how V1 state/provider works, and what V0 intentionally does not include.

Final verification:

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-alerts.test.ts tests/unit/workbench-contract.test.ts`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench creates a price alert"`
- `pnpm build`
- `git diff --check`
- `git status --short`

## Merge Gate

After all tasks pass their two-stage reviews, run a final branch review over the full Alerts V0 branch. Merge back to `main` only after the final reviewer approves and final verification is green.
