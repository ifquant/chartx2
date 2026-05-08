# Chartx2 Host Integration Guide

Date: 2026-05-04

This note defines the current stable way for `alpha2` or another host to embed
`chartx2` as a library.

For a readiness-oriented audit of which surfaces are already strong enough to
consume directly versus which still lean on demo-era assumptions, see
[alpha2-host-surface-readiness.md](/Users/dev/workspace2/hc_apps/chartx2/docs/alpha2-host-surface-readiness.md).

The goal is not to reuse the whole demo app. The goal is to consume:

- the engine-facing public contracts
- the workstation-facing public models
- the reusable host-facing Svelte shells

through the public `@chartx2/library` barrel.

## What `chartx2` Owns

`chartx2` owns:

- chart engine behavior
- chart workstation view models
- chart-adjacent UI shells for sharing, strategy, trading, and sync
- reusable host summary cards, strip, and dock composition

`chartx2` does not own:

- broker execution
- account services
- sync backend
- publishing backend
- marketplace backend
- long-term script execution core

Those remain host-owned, with `alpha2` as the intended near-term consumer and a
future Rust core as the long-term execution boundary.

## Public Entry Points

Use the public barrel only:

```ts
import type {
  ChartWorkbenchModel,
  ShareDialogModel,
  StrategyTesterPanelModel,
  TradingTicketModel,
  AccountSyncSurfaceModel,
} from "@chartx2/library";

import {
  ShareDialogShell,
  ShareArtifactSummaryCard,
  StrategyTesterPanel,
  StrategyTesterSummaryCard,
  TradingTicketPanel,
  TradingTicketSummaryCard,
  AccountSyncStatusCard,
  AccountSyncSummaryCard,
  WorkbenchHostSummaryStrip,
  WorkbenchHostSurfaceDock,
} from "@chartx2/library";
```

There is also a checked-in minimal example component at:

- [Alpha2HostIntegrationExample.svelte](/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/Alpha2HostIntegrationExample.svelte)

That file is intended to be copied or adapted by a host that wants the smallest
working composition of:

- share shell
- strategy tester shell
- trading ticket shell
- account sync shell
- summary dock

Do not import:

- `src/lib/demo/components/...`
- `src/lib/chartx/internal/...`
- demo runtime helpers from `chartx-demo.ts`

If a host needs something that is only available there, treat that as a missing
public seam and add it deliberately.

## Current Reusable Surfaces

The current host-facing surfaces are:

- `ShareDialogShell`
- `ShareArtifactSummaryCard`
- `StrategyTesterPanel`
- `StrategyTesterSummaryCard`
- `TradingTicketPanel`
- `TradingTicketSummaryCard`
- `AccountSyncStatusCard`
- `AccountSyncSummaryCard`
- `WorkbenchHostSummaryStrip`
- `WorkbenchHostSurfaceDock`

The intended usage split is:

- full panel/dialog when the host wants the full workstation flow
- summary card when the host wants a compact external surface
- summary strip or dock when the host wants to compose several host surfaces
  together

## Minimal Host Responsibilities

A host still needs to own:

- model creation
- persistence/loading of those models
- action callbacks
- cross-surface routing

Concretely:

- `ShareDialogShell` needs the host to decide what `onRunAction(...)` means
- `StrategyTesterPanel` needs the host to decide what locating a trade/run
  should do
- `TradingTicketPanel` needs the host to own submission/review behavior
- `AccountSyncStatusCard` needs the host to own refresh/status actions

The reusable shells are intentionally UI-first. They do not smuggle backend
logic into `chartx2`.

## Recommended Composition Pattern

For a host like `alpha2`, the current low-friction composition pattern is:

1. Use the public contracts to build readonly or fixture-backed shell models.
2. Mount the full panels/dialogs only where the user needs the larger workflow.
3. Use `WorkbenchHostSurfaceDock` when you want one compact summary deck that
   combines:
   - share summary
   - strategy summary
   - trading summary
   - sync summary

Example:

```svelte
<script lang="ts">
  import type {
    ShareDialogModel,
    StrategyTesterSummaryShellModel,
    TradingTicketSummaryShellModel,
    AccountSyncSummaryShellModel,
    WorkbenchHostSummarySurfaceModel,
  } from "@chartx2/library";
  import { WorkbenchHostSurfaceDock } from "@chartx2/library";

  export let shareDialog: ShareDialogModel | null = null;
  export let hostSummarySurfaces: readonly WorkbenchHostSummarySurfaceModel[] = [];
  export let strategyTesterSummary: StrategyTesterSummaryShellModel | null = null;
  export let tradingTicketSummary: TradingTicketSummaryShellModel | null = null;
  export let accountSyncSummary: AccountSyncSummaryShellModel | null = null;
</script>

<WorkbenchHostSurfaceDock
  shareSummary={shareDialog?.summaryCard ?? null}
  hostSummarySurfaces={hostSummarySurfaces}
  strategyTesterSummary={strategyTesterSummary}
  tradingTicketSummary={tradingTicketSummary}
  accountSyncSummary={accountSyncSummary}
  onOpenShareShell={() => {
    // host-owned dialog open
  }}
  onOpenStrategyTester={() => {
    // host-owned panel routing
  }}
  onOpenTradingTicket={() => {
    // host-owned panel routing
  }}
  onRefreshAccountSync={() => {
    // host-owned refresh action
  }}
/>
```

If you want a fuller copyable baseline instead of the inline snippet above, use
`Alpha2HostIntegrationExample.svelte` as the concrete reference.

## Summary Registry Rule

If the host uses `WorkbenchHostSummaryStrip` or `WorkbenchHostSurfaceDock`,
populate `ChartWorkbenchModel.hostSummarySurfaces` instead of hardcoding local
visibility checks.

Current supported kinds are:

- `strategy-tester`
- `trading-ticket`
- `account-sync`

That registry is the stable seam for deciding which summary shells belong in a
footer or host summary deck.

## When To Use The Full Workbench

Use the full workbench shell when the host needs:

- multi-chart layout
- sidebar panels
- bottom tab routing
- integrated replay/layout/command behavior

Use only the smaller host shells when the host already has its own shell and
just wants chart-adjacent cards, dialogs, or panels.

## Current Non-Goals

This integration seam still does not try to solve:

- host-side package/versioning split
- generic runtime callback registries
- one giant public UI runtime model for every shell
- backend adapters for broker, sync, or publishing

Those remain separate decisions.

## Practical Rule For `alpha2`

For now, `alpha2` should treat `chartx2` as:

- public TypeScript contracts from `src/lib/chartx/public`
- reusable Svelte host shells from the same barrel
- host-owned runtime wiring everywhere else

That is the intended boundary until the Rust core and broader host integration
story are ready.
