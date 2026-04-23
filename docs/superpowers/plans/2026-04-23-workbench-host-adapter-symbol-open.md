# Workbench Host Adapter Symbol Open Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first executable Workstation Parity slice: a typed workbench host adapter plus fixture-driven watchlist symbol open flow.

**Architecture:** Add a public host-adapter contract that resolves symbols and loads chart bars without reaching into chart internals. Move demo market fixtures behind a fixture host adapter, then wire the workbench controller and Svelte panel so watchlist clicks rebuild the active chart through that adapter. Keep `chart-harness` untouched and keep `src/routes/+page.svelte` as shell glue only.

**Tech Stack:** Svelte 5, SvelteKit, TypeScript, Vitest, Playwright visual tests, existing `PhaseOneChartApi` public chart API.

---

## Scope Check

The full plan in `docs/tradingview-alignment-plan.md` covers Foundation, Workstation, and Platform Parity. That is too broad for one executable implementation plan.

This plan implements only the first Workstation Parity slice:

- `WorkbenchHostAdapter`
- fixture adapter
- watchlist symbol open
- active symbol projection into the toolbar/sidebar
- unit and visual coverage

This plan does not implement saved layouts, indicator catalog, alerts, object tree, multi-chart layout, replay, screener, script runtime, broker integration, or cloud sync.

## Current Code Map

- `src/lib/chartx/public/workbench.ts`
  - currently owns workbench model types and `createChartWorkbenchModel`
  - already defines `MarketDataAdapter`, `WatchlistProvider`, `AlertProvider`, `WorkbenchPersistenceProvider`, and `HostIntentBridge`
  - does not yet expose one unified adapter that can list watchlist items, resolve symbols, and load chart-ready bars

- `src/lib/chartx/public/index.ts`
  - currently exports `market`, `performance`, and `workbench`
  - must export the new host-adapter module

- `src/lib/demo/chartx-demo.ts`
  - currently hardcodes workbench symbol `NDX`
  - currently creates watchlist rows inside `publishSnapshot`
  - currently creates market bars through private `createWorkbenchBars`, `createVolumeData`, and `createLineData`
  - currently has no `openSymbol` controller method

- `src/lib/demo/components/MarketWorkbenchPanel.svelte`
  - currently renders watchlist rows as inert `<article>` elements
  - must emit a symbol-open callback through a prop rather than importing demo internals

- `src/routes/+page.svelte`
  - currently mounts the workbench demo and forwards chart/drawing actions
  - must stay shell-level and only call `workbenchController.openSymbol`

- `tests/unit/workbench-contract.test.ts`
  - existing model contract tests
  - should gain active watchlist item coverage

- `tests/visual/phase-one-harness.spec.ts`
  - existing browser coverage for the workbench
  - should gain one symbol-open flow test

## File Structure

Create:

- `src/lib/chartx/public/workbench-host.ts`
  - public host-adapter contract and pure open-symbol helper

- `src/lib/demo/workbench-fixtures.ts`
  - deterministic fixture symbols, watchlist rows, bar generation, and fixture host adapter

- `tests/unit/workbench-host-adapter.test.ts`
  - unit tests for host-adapter success and failure semantics

Modify:

- `src/lib/chartx/public/index.ts`
  - export `workbench-host`

- `src/lib/chartx/public/workbench.ts`
  - add `activeItemId` to `WatchlistPanelModel`
  - add `activeWatchlistItemId` to `ChartWorkbenchModelInput`
  - project active watchlist item into the model

- `src/lib/demo/chartx-demo.ts`
  - import fixture helpers
  - keep active symbol/exchange/payload state
  - add `openSymbol` to `DemoController`
  - use adapter-provided watchlist rows and chart payloads in snapshots/rebuilds

- `src/lib/demo/components/MarketWorkbenchPanel.svelte`
  - add `onOpenWatchlistSymbol`
  - render watchlist rows as buttons
  - mark the active symbol row

- `src/routes/+page.svelte`
  - pass `onOpenWatchlistSymbol`
  - add a shell-level async handler that calls `workbenchController.openSymbol`

- `tests/unit/workbench-contract.test.ts`
  - assert active watchlist item projection

- `tests/visual/phase-one-harness.spec.ts`
  - add browser coverage for clicking a watchlist item

- `tutorials/commit/0278-add-workbench-host-adapter-symbol-open.md`
  - commit tutorial for this implementation slice

## Task 1: Public Host Adapter Contract

**Files:**

- Create: `src/lib/chartx/public/workbench-host.ts`
- Modify: `src/lib/chartx/public/index.ts`
- Test: `tests/unit/workbench-host-adapter.test.ts`

- [ ] **Step 1: Write the failing host-adapter tests**

Create `tests/unit/workbench-host-adapter.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import {
  openWorkbenchSymbol,
  type WorkbenchHostAdapter,
} from "../../src/lib/chartx/public/workbench-host";

const NDX_BARS = [
  { time: 1, open: 10, high: 12, low: 9, close: 11 },
  { time: 2, open: 11, high: 13, low: 10, close: 12 },
] as const;

describe("workbench host adapter", () => {
  it("resolves a symbol and loads bars through one open-symbol helper", async () => {
    const adapter: WorkbenchHostAdapter = {
      listWatchlistItems: vi.fn(async () => []),
      resolveSymbol: vi.fn(async (symbol) => ({
        symbol,
        name: "Nasdaq 100",
        exchange: "NASDAQ",
        defaultTimeframe: "1D",
      })),
      loadBars: vi.fn(async (symbol, timeframe) => ({
        symbol,
        timeframe,
        exchangeLabel: "NASDAQ",
        bars: NDX_BARS,
        volume: [
          { time: 1, value: 1000, color: "#10b981" },
          { time: 2, value: 1200, color: "#10b981" },
        ],
        line: [
          { time: 1, value: 11 },
          { time: 2, value: 12 },
        ],
      })),
    };

    const result = await openWorkbenchSymbol(adapter, {
      symbol: "NDX",
      timeframe: "1D",
      source: "watchlist",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.symbol.symbol).toBe("NDX");
      expect(result.payload.bars).toHaveLength(2);
      expect(result.payload.timeframe).toBe("1D");
    }
    expect(adapter.resolveSymbol).toHaveBeenCalledWith("NDX");
    expect(adapter.loadBars).toHaveBeenCalledWith("NDX", "1D");
  });

  it("reports an unresolved symbol without loading bars", async () => {
    const adapter: WorkbenchHostAdapter = {
      listWatchlistItems: vi.fn(async () => []),
      resolveSymbol: vi.fn(async () => null),
      loadBars: vi.fn(async () => {
        throw new Error("loadBars should not run for unresolved symbols");
      }),
    };

    const result = await openWorkbenchSymbol(adapter, {
      symbol: "MISSING",
      timeframe: "1D",
      source: "watchlist",
    });

    expect(result).toEqual({
      ok: false,
      reason: "symbol-not-found",
      symbol: "MISSING",
    });
    expect(adapter.loadBars).not.toHaveBeenCalled();
  });

  it("reports empty data when the adapter resolves a symbol but returns no bars", async () => {
    const adapter: WorkbenchHostAdapter = {
      listWatchlistItems: vi.fn(async () => []),
      resolveSymbol: vi.fn(async (symbol) => ({
        symbol,
        name: "Empty Instrument",
        exchange: "TEST",
      })),
      loadBars: vi.fn(async (symbol, timeframe) => ({
        symbol,
        timeframe,
        exchangeLabel: "TEST",
        bars: [],
        volume: [],
        line: [],
      })),
    };

    const result = await openWorkbenchSymbol(adapter, {
      symbol: "EMPTY",
      timeframe: "1D",
      source: "watchlist",
    });

    expect(result).toEqual({
      ok: false,
      reason: "empty-bars",
      symbol: "EMPTY",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts
```

Expected: FAIL because `src/lib/chartx/public/workbench-host.ts` does not exist.

- [ ] **Step 3: Add the public host-adapter module**

Create `src/lib/chartx/public/workbench-host.ts`:

```ts
import type {
  PhaseOneCandlestickData,
  PhaseOneLineData,
  PhaseOneVolumeData,
} from "./market";
import type { WatchlistItemModel } from "./workbench";

export type WorkbenchSymbolOpenSource = "search" | "watchlist" | "host";

export interface WorkbenchSymbolDescriptor {
  symbol: string;
  name: string;
  exchange?: string;
  defaultTimeframe?: string;
}

export interface WorkbenchBarsPayload {
  symbol: string;
  timeframe: string;
  exchangeLabel?: string;
  bars: readonly PhaseOneCandlestickData[];
  volume: readonly PhaseOneVolumeData[];
  line: readonly PhaseOneLineData[];
}

export interface WorkbenchHostAdapter {
  listWatchlistItems(): Promise<readonly WatchlistItemModel[]>;
  resolveSymbol(symbol: string): Promise<WorkbenchSymbolDescriptor | null>;
  loadBars(symbol: string, timeframe: string): Promise<WorkbenchBarsPayload>;
}

export interface WorkbenchOpenSymbolIntent {
  symbol: string;
  timeframe?: string;
  source: WorkbenchSymbolOpenSource;
}

export type WorkbenchOpenSymbolResult =
  | {
      ok: true;
      source: WorkbenchSymbolOpenSource;
      symbol: WorkbenchSymbolDescriptor;
      payload: WorkbenchBarsPayload;
    }
  | {
      ok: false;
      reason: "symbol-not-found" | "empty-bars";
      symbol: string;
    };

export async function openWorkbenchSymbol(
  adapter: WorkbenchHostAdapter,
  intent: WorkbenchOpenSymbolIntent,
): Promise<WorkbenchOpenSymbolResult> {
  const descriptor = await adapter.resolveSymbol(intent.symbol);
  if (descriptor === null) {
    return {
      ok: false,
      reason: "symbol-not-found",
      symbol: intent.symbol,
    };
  }

  const timeframe = intent.timeframe ?? descriptor.defaultTimeframe ?? "1D";
  const payload = await adapter.loadBars(descriptor.symbol, timeframe);
  if (payload.bars.length === 0) {
    return {
      ok: false,
      reason: "empty-bars",
      symbol: descriptor.symbol,
    };
  }

  return {
    ok: true,
    source: intent.source,
    symbol: descriptor,
    payload,
  };
}
```

- [ ] **Step 4: Export the new module**

Modify `src/lib/chartx/public/index.ts`:

```ts
export * from "./market";
export * from "./performance";
export * from "./workbench";
export * from "./workbench-host";
```

- [ ] **Step 5: Run the focused unit test**

Run:

```bash
pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the contract slice**

Run:

```bash
git add src/lib/chartx/public/index.ts src/lib/chartx/public/workbench-host.ts tests/unit/workbench-host-adapter.test.ts
git commit -m "feat(chartx2-workbench): add host adapter symbol contract" \
  -m "Introduce the first public workbench host adapter boundary so symbol resolution and bar loading can be tested outside the demo page." \
  -m "Changes:
- add a WorkbenchHostAdapter contract for watchlist rows, symbol resolution, and chart-ready bar payloads
- add openWorkbenchSymbol success and failure semantics
- export the host adapter from the public chartx entrypoint" \
  -m "Verification:
- pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts (PASS)" \
  -m "Not included:
- no Svelte UI wiring
- no saved layout or persistence provider implementation"
```

## Task 2: Fixture Host Adapter And Active Watchlist Model

**Files:**

- Create: `src/lib/demo/workbench-fixtures.ts`
- Modify: `src/lib/chartx/public/workbench.ts`
- Modify: `tests/unit/workbench-contract.test.ts`
- Test: `tests/unit/workbench-host-adapter.test.ts`

- [ ] **Step 1: Add failing tests for fixture rows and active item projection**

Append to `tests/unit/workbench-host-adapter.test.ts`:

```ts
import { createWorkbenchFixtureHostAdapter } from "../../src/lib/demo/workbench-fixtures";

describe("workbench fixture host adapter", () => {
  it("provides deterministic watchlist rows and chart payloads", async () => {
    const adapter = createWorkbenchFixtureHostAdapter();

    const rows = await adapter.listWatchlistItems();
    const ndx = await adapter.resolveSymbol("NDX");
    const spxPayload = await adapter.loadBars("SPX", "1D");
    const ndxPayload = await adapter.loadBars("NDX", "1D");

    expect(rows.map((row) => row.symbol)).toEqual(["NDX", "SPX", "DJI", "VIX"]);
    expect(ndx).toEqual({
      symbol: "NDX",
      name: "Nasdaq 100",
      exchange: "NASDAQ",
      defaultTimeframe: "1D",
    });
    expect(spxPayload.bars).toHaveLength(10_000);
    expect(ndxPayload.bars).toHaveLength(10_000);
    expect(spxPayload.bars[0]?.close).not.toBe(ndxPayload.bars[0]?.close);
  });
});
```

Add this assertion to the first test in `tests/unit/workbench-contract.test.ts` after the existing watchlist length assertion:

```ts
expect(model.rightSidebar.watchlist.activeItemId).toBe("ndx");
```

Also add `activeWatchlistItemId: "ndx",` to the `createChartWorkbenchModel` input in that same test.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts tests/unit/workbench-contract.test.ts
```

Expected: FAIL because `workbench-fixtures.ts` does not exist and `activeItemId` is not projected.

- [ ] **Step 3: Add active item fields to the workbench model**

Modify `src/lib/chartx/public/workbench.ts`.

Update `WatchlistPanelModel`:

```ts
export interface WatchlistPanelModel {
  title: string;
  activeListId: string;
  activeItemId?: string;
  items: readonly WatchlistItemModel[];
}
```

Update `ChartWorkbenchModelInput`:

```ts
export interface ChartWorkbenchModelInput {
  title?: string;
  symbol: string;
  exchangeLabel?: string;
  timeframeLabel: string;
  chartTypeLabel: string;
  drawingTools?: readonly WorkbenchToolDescriptor[];
  activeToolId?: string;
  watchlistItems?: readonly WatchlistItemModel[];
  activeWatchlistItemId?: string;
  alertItems?: readonly AlertSummaryModel[];
  activeRange?: string;
  ranges?: readonly string[];
  activeTab?: BottomPanelTabId;
  layoutPreset?: MultiChartLayoutPreset;
  symbolMode?: WorkbenchSymbolMode;
  chartHosts?: readonly ChartHostModel[];
}
```

Update the watchlist projection inside `createChartWorkbenchModel`:

```ts
rightSidebar: {
  watchlist: {
    title: "Watchlist",
    activeListId: "default",
    activeItemId: input.activeWatchlistItemId,
    items: input.watchlistItems ?? [],
  },
  alerts: {
    title: "Alerts",
    items: input.alertItems ?? [],
  },
  placeholders: DEFAULT_PLACEHOLDERS,
},
```

- [ ] **Step 4: Add deterministic fixture adapter module**

Create `src/lib/demo/workbench-fixtures.ts`:

```ts
import type {
  PhaseOneCandlestickData,
  PhaseOneLineData,
  PhaseOneVolumeData,
} from "$lib/chartx/public/market";
import type { WatchlistItemModel } from "$lib/chartx/public/workbench";
import type {
  WorkbenchBarsPayload,
  WorkbenchHostAdapter,
  WorkbenchSymbolDescriptor,
} from "$lib/chartx/public/workbench-host";

const DAY = 60_000;
const BASE_TIME = Date.UTC(2026, 2, 2, 1, 30, 0);

const FIXTURE_SYMBOLS: readonly (WorkbenchSymbolDescriptor & {
  id: string;
  lastLabel: string;
  changeLabel: string;
  changeTone: "positive" | "negative" | "neutral";
  offset: number;
})[] = [
  {
    id: "ndx",
    symbol: "NDX",
    name: "Nasdaq 100",
    exchange: "NASDAQ",
    defaultTimeframe: "1D",
    lastLabel: "23,132.77",
    changeLabel: "-1.93%",
    changeTone: "negative",
    offset: 0,
  },
  {
    id: "spx",
    symbol: "SPX",
    name: "S&P 500",
    exchange: "NYSE",
    defaultTimeframe: "1D",
    lastLabel: "6,368.86",
    changeLabel: "-1.67%",
    changeTone: "negative",
    offset: 420,
  },
  {
    id: "dji",
    symbol: "DJI",
    name: "Dow Jones Industrial Average",
    exchange: "DJI",
    defaultTimeframe: "1D",
    lastLabel: "45,166.64",
    changeLabel: "-1.73%",
    changeTone: "negative",
    offset: 860,
  },
  {
    id: "vix",
    symbol: "VIX",
    name: "Volatility Index",
    exchange: "CBOE",
    defaultTimeframe: "1D",
    lastLabel: "30.73",
    changeLabel: "-1.03%",
    changeTone: "negative",
    offset: -320,
  },
];

function fixtureSymbol(symbol: string) {
  return FIXTURE_SYMBOLS.find((entry) => entry.symbol === symbol.toUpperCase()) ?? null;
}

export function createWorkbenchFixtureWatchlist(): WatchlistItemModel[] {
  return FIXTURE_SYMBOLS.map((entry) => ({
    id: entry.id,
    symbol: entry.symbol,
    name: entry.name,
    lastLabel: entry.lastLabel,
    changeLabel: entry.changeLabel,
    changeTone: entry.changeTone,
  }));
}

export function createWorkbenchBars(
  count: number,
  offset = 0,
): PhaseOneCandlestickData[] {
  const rows: PhaseOneCandlestickData[] = [];
  let close = 16_800 + offset;

  for (let index = 0; index < count; index += 1) {
    const cycle = Math.sin(index / 11) * 22 + Math.cos(index / 29) * 16;
    const drift = Math.sin(index / 47) * 8;
    const open = close + Math.sin(index / 7) * 10;
    close = open + cycle * 0.42 + drift * 0.3;
    const high = Math.max(open, close) + 18 + Math.sin(index / 5) * 4;
    const low = Math.min(open, close) - 18 - Math.cos(index / 6) * 4;

    rows.push({
      time: BASE_TIME + index * DAY,
      open,
      high,
      low,
      close,
    });
  }

  return rows;
}

export function createVolumeData(
  bars: readonly PhaseOneCandlestickData[],
): PhaseOneVolumeData[] {
  return bars.map((bar, index) => ({
    time: bar.time,
    value: Math.max(100, Math.round(900 + Math.sin(index / 9) * 220 + index % 17 * 18)),
    color: bar.close >= bar.open ? "rgba(16, 185, 129, 0.52)" : "rgba(239, 68, 68, 0.52)",
  }));
}

export function createLineData(
  bars: readonly PhaseOneCandlestickData[],
  smoothing = 6,
): PhaseOneLineData[] {
  return bars.map((bar, index) => {
    const from = Math.max(0, index - smoothing + 1);
    const slice = bars.slice(from, index + 1);
    const average = slice.reduce((total, row) => total + row.close, 0) / slice.length;
    return {
      time: bar.time,
      value: average,
    };
  });
}

export function createWorkbenchFixtureBarsPayload(
  symbol: string,
  timeframe = "1D",
): WorkbenchBarsPayload {
  const descriptor = fixtureSymbol(symbol) ?? FIXTURE_SYMBOLS[0]!;
  const bars = createWorkbenchBars(10_000, descriptor.offset);

  return {
    symbol: descriptor.symbol,
    timeframe,
    exchangeLabel: descriptor.exchange,
    bars,
    volume: createVolumeData(bars),
    line: createLineData(bars),
  };
}

export function createWorkbenchFixtureHostAdapter(): WorkbenchHostAdapter {
  return {
    async listWatchlistItems() {
      return createWorkbenchFixtureWatchlist();
    },
    async resolveSymbol(symbol) {
      const descriptor = fixtureSymbol(symbol);
      if (descriptor === null) {
        return null;
      }
      return {
        symbol: descriptor.symbol,
        name: descriptor.name,
        exchange: descriptor.exchange,
        defaultTimeframe: descriptor.defaultTimeframe,
      };
    },
    async loadBars(symbol, timeframe) {
      return createWorkbenchFixtureBarsPayload(symbol, timeframe);
    },
  };
}
```

- [ ] **Step 5: Run the focused tests**

Run:

```bash
pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts tests/unit/workbench-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the fixture slice**

Run:

```bash
git add src/lib/chartx/public/workbench.ts src/lib/demo/workbench-fixtures.ts tests/unit/workbench-contract.test.ts tests/unit/workbench-host-adapter.test.ts
git commit -m "feat(chartx2-workbench): add fixture host adapter" \
  -m "Move the demo workbench toward a host-driven data boundary by adding deterministic fixture symbols, watchlist rows, and chart-ready bar payloads." \
  -m "Changes:
- add a fixture workbench host adapter with deterministic symbol and bar payloads
- add active watchlist item projection to the public workbench model
- cover fixture adapter and active watchlist model behavior with unit tests" \
  -m "Verification:
- pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts tests/unit/workbench-contract.test.ts (PASS)" \
  -m "Not included:
- no Svelte watchlist click wiring yet
- no persistence or saved layout support"
```

## Task 3: Workbench Controller Symbol Open

**Files:**

- Modify: `src/lib/demo/chartx-demo.ts`
- Test: `tests/unit/workbench-host-adapter.test.ts`

- [ ] **Step 1: Add controller-level symbol-open test**

Append to `tests/unit/workbench-host-adapter.test.ts`:

```ts
import {
  createWorkbenchFixtureBarsPayload,
  createWorkbenchFixtureWatchlist,
} from "../../src/lib/demo/workbench-fixtures";

describe("workbench fixture payload helpers", () => {
  it("keeps the active symbol payload chart-ready", () => {
    const rows = createWorkbenchFixtureWatchlist();
    const payload = createWorkbenchFixtureBarsPayload(rows[0]!.symbol, "1D");

    expect(payload.symbol).toBe("NDX");
    expect(payload.exchangeLabel).toBe("NASDAQ");
    expect(payload.volume).toHaveLength(payload.bars.length);
    expect(payload.line).toHaveLength(payload.bars.length);
  });
});
```

- [ ] **Step 2: Run the focused test**

Run:

```bash
pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts
```

Expected: PASS after Task 2. This test protects the helper used by the controller before Svelte integration starts.

- [ ] **Step 3: Import fixture and host helpers in `chartx-demo.ts`**

Modify imports near the top of `src/lib/demo/chartx-demo.ts`.

Add:

```ts
import {
  createLineData,
  createVolumeData,
  createWorkbenchBars,
  createWorkbenchFixtureBarsPayload,
  createWorkbenchFixtureHostAdapter,
} from "$lib/demo/workbench-fixtures";
import {
  openWorkbenchSymbol,
  type WorkbenchBarsPayload,
  type WorkbenchHostAdapter,
} from "$lib/chartx/public/workbench-host";
```

- [ ] **Step 4: Extend controller types**

Modify `DemoController` in `src/lib/demo/chartx-demo.ts`:

```ts
export type DemoController = {
  actions(): readonly DemoAction[];
  runAction(actionId: string): void;
  openSymbol?(symbol: string): Promise<boolean>;
  locateTrade?(intent: TradeLocationIntent): boolean;
  applySelectedDrawingOptions?(options: Record<string, unknown>): void;
  setDrawingTool?(tool: WorkbenchDrawingTool): void;
  setPointFigureAutoScale?(scale: number): void;
  setPointFigureMode?(mode: WorkbenchPointFigureMode): void;
  setPointFigureAtrLength?(length: number): void;
  setPointFigurePercentageValue?(value: number): void;
  setKagiMode?(mode: WorkbenchKagiMode): void;
  setKagiFixedReversalSize?(value: number): void;
  setKagiAutoScale?(scale: number): void;
  setKagiAtrLength?(length: number): void;
  setKagiPercentageValue?(value: number): void;
  destroy(): void;
};
```

Add this type below `type SnapshotPublisher = (snapshot: DemoSnapshot) => void;`:

```ts
export type WorkbenchDemoOptions = {
  hostAdapter?: WorkbenchHostAdapter;
  initialSymbol?: string;
  initialTimeframe?: string;
};
```

- [ ] **Step 5: Update `mountWorkbenchDemo` signature and active symbol state**

Change the function signature:

```ts
export function mountWorkbenchDemo(
  canvas: HTMLCanvasElement,
  publish: SnapshotPublisher,
  options: WorkbenchDemoOptions = {},
): DemoController {
```

Add this state near the existing `let chart: PhaseOneChartApi | null = null;` block:

```ts
  const hostAdapter = options.hostAdapter ?? createWorkbenchFixtureHostAdapter();
  let activeSymbol = options.initialSymbol ?? "NDX";
  let activeTimeframe = options.initialTimeframe ?? "1D";
  let activeExchangeLabel = "NASDAQ";
  let activeBarsPayload: WorkbenchBarsPayload = createWorkbenchFixtureBarsPayload(
    activeSymbol,
    activeTimeframe,
  );
  let workbenchWatchlist: readonly WatchlistItemModel[] = [];
```

- [ ] **Step 6: Route workbench series through active payload**

Replace the `workbenchSeries` helper body with:

```ts
  const workbenchSeries = (chartType: WorkbenchMainChartType) => {
    const bars = activeBarsPayload.bars;
    return {
      bars,
      volume: activeBarsPayload.volume,
      line: activeBarsPayload.line,
      visibleTrendStartBar: bars.at(-52) ?? bars[0]!,
      visibleTrendEndBar: bars.at(-18) ?? bars.at(-1) ?? bars[0]!,
    };
  };
```

- [ ] **Step 7: Load fixture watchlist once**

After `workbenchSeries` is declared, add:

```ts
  void hostAdapter.listWatchlistItems().then((items) => {
    workbenchWatchlist = items;
    publishSnapshot();
  });
```

- [ ] **Step 8: Use active symbol and watchlist rows in `publishSnapshot`**

Remove the local hard-coded `const workbenchWatchlist: WatchlistItemModel[]` fixture array block from `publishSnapshot`.

Change `createChartWorkbenchModel` input inside `publishSnapshot`:

```ts
    const activeWatchlistItemId =
      workbenchWatchlist.find((item) => item.symbol === activeSymbol)?.id ?? undefined;
    const workbenchModel = createChartWorkbenchModel({
      title: "Market Workbench",
      symbol: activeSymbol,
      exchangeLabel: activeExchangeLabel,
      timeframeLabel: activeTimeframe,
      chartTypeLabel: formatWorkbenchChartType(mainChartType),
      drawingTools: drawingToolsForSnapshot(drawingTool),
      activeToolId: drawingTool,
      watchlistItems: workbenchWatchlist,
      activeWatchlistItemId,
      alertItems: workbenchAlerts,
      activeRange: activeTimeframe,
      layoutPreset: "single",
      chartHosts: [
        {
          id: "market-main",
          family: "market",
          title: `${activeSymbol} market chart`,
          slotId: "slot-main",
          active: true,
        },
      ],
    });
```

- [ ] **Step 9: Add controller open-symbol method**

Inside the returned `DemoController` object, add this method before `locateTrade`:

```ts
    async openSymbol(symbol) {
      const result = await openWorkbenchSymbol(hostAdapter, {
        symbol,
        timeframe: activeTimeframe,
        source: "watchlist",
      });

      if (!result.ok) {
        pushLog(log, `failed to open ${symbol}: ${result.reason}`);
        publishSnapshot();
        return false;
      }

      activeSymbol = result.symbol.symbol;
      activeTimeframe = result.payload.timeframe;
      activeExchangeLabel = result.payload.exchangeLabel ?? result.symbol.exchange ?? "";
      activeBarsPayload = result.payload;
      activeTradeLocationIntent = null;
      mainChartType = "candlestick";
      pushLog(log, `opened symbol ${activeSymbol} from watchlist`);
      rebuild();
      return true;
    },
```

- [ ] **Step 10: Remove duplicate private fixture helpers**

Remove these private declarations from the bottom of `src/lib/demo/chartx-demo.ts` because they now live in `src/lib/demo/workbench-fixtures.ts`:

```ts
function createWorkbenchBars(count: number): PhaseOneCandlestickData[] {
}

function createVolumeData(bars: readonly PhaseOneCandlestickData[]): PhaseOneVolumeData[] {
}

function createLineData(
  bars: readonly PhaseOneCandlestickData[],
  smoothing = 6,
): PhaseOneLineData[] {
}
```

The actual file should remove the full existing bodies for those three functions. Keep `formatTime`, `formatMaybeNumber`, and `pushLog`.

- [ ] **Step 11: Run TypeScript and unit checks**

Run:

```bash
pnpm check
pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts
```

Expected: both PASS.

- [ ] **Step 12: Commit controller integration**

Run:

```bash
git add src/lib/demo/chartx-demo.ts tests/unit/workbench-host-adapter.test.ts
git commit -m "feat(chartx2-workbench): route demo symbols through host adapter" \
  -m "Wire the market workbench demo to a host adapter backed by deterministic fixtures so active symbols can change without page-local data ownership." \
  -m "Changes:
- add active symbol, timeframe, exchange, and bar-payload state to the workbench controller
- route workbench series data and watchlist rows through fixture host data
- expose an async controller openSymbol method with success and failure logging" \
  -m "Verification:
- pnpm check (PASS)
- pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts (PASS)" \
  -m "Not included:
- no Svelte click wiring yet
- no saved layout persistence"
```

## Task 4: Watchlist Click UI

**Files:**

- Modify: `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- Modify: `src/routes/+page.svelte`
- Test: `tests/visual/phase-one-harness.spec.ts`

- [ ] **Step 1: Add failing visual test for watchlist click**

Append to `tests/visual/phase-one-harness.spec.ts`:

```ts
test("workbench opens a watchlist symbol through the host adapter", async ({ page }) => {
  await page.goto("/");

  const workbench = page.locator('[data-demo-tab="workbench"]');
  await expect(workbench).toContainText("NDX Workbench");

  await workbench.getByRole("button", { name: /SPX/ }).click();

  await expect(workbench).toContainText("SPX Workbench");
  await expect(workbench).toContainText("opened symbol SPX from watchlist");
  await expect(workbench.getByRole("button", { name: /SPX/ })).toHaveClass(/active/);
});
```

- [ ] **Step 2: Run the visual test to verify it fails**

Run:

```bash
pnpm test:visual -- tests/visual/phase-one-harness.spec.ts -g "watchlist symbol"
```

Expected: FAIL because watchlist rows are not buttons and do not call the controller.

- [ ] **Step 3: Add panel callback prop**

Modify `src/lib/demo/components/MarketWorkbenchPanel.svelte` script block:

```ts
  export let onOpenWatchlistSymbol: (symbol: string) => void;
```

- [ ] **Step 4: Render watchlist rows as active buttons**

Replace the watchlist row loop in `MarketWorkbenchPanel.svelte`:

```svelte
          {#each workbench?.rightSidebar.watchlist.items ?? [] as item}
            <button
              class="watch-row"
              class:active={item.id === workbench?.rightSidebar.watchlist.activeItemId}
              type="button"
              on:click={() => onOpenWatchlistSymbol(item.symbol)}
            >
              <strong>{item.symbol}</strong>
              <span>{item.lastLabel}</span>
              <span>{item.changeLabel}</span>
            </button>
          {/each}
```

- [ ] **Step 5: Add watch-row styles**

In the `<style>` block of `MarketWorkbenchPanel.svelte`, add:

```css
  .watch-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 8px;
    align-items: center;
    width: 100%;
    padding: 7px 8px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .watch-row:hover,
  .watch-row.active {
    background: rgba(24, 24, 27, 0.07);
  }

  .watch-row.active strong {
    color: #18181b;
  }
```

If an existing `.watch-body article` selector controls row layout, keep it and add `.watch-row` to the selector list:

```css
  .card-head,
  .chart-meta,
  .market-line,
  .readout-bar,
  .sidebar-head,
  .watch-head,
  .watch-body article,
  .watch-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: nowrap;
  }
```

- [ ] **Step 6: Add shell handler in `+page.svelte`**

Add this function near `setWorkbenchDrawingTool`:

```ts
  async function openWorkbenchSymbol(symbol: string): Promise<void> {
    const opened = await workbenchController?.openSymbol?.(symbol);
    if (opened) {
      workbenchActions = workbenchController?.actions() ?? [];
    }
  }
```

- [ ] **Step 7: Pass the handler to the panel**

Modify the `MarketWorkbenchPanel` props in `src/routes/+page.svelte`:

```svelte
          onOpenWatchlistSymbol={(symbol) => {
            void openWorkbenchSymbol(symbol);
          }}
```

- [ ] **Step 8: Run check and visual test**

Run:

```bash
pnpm check
pnpm test:visual -- tests/visual/phase-one-harness.spec.ts -g "watchlist symbol"
```

Expected: both PASS.

- [ ] **Step 9: Commit UI integration**

Run:

```bash
git add src/lib/demo/components/MarketWorkbenchPanel.svelte src/routes/+page.svelte tests/visual/phase-one-harness.spec.ts
git commit -m "feat(chartx2-workbench): open watchlist symbols from the panel" \
  -m "Turn the workbench watchlist from static display into a host-adapter driven symbol-open flow while keeping the page shell limited to controller forwarding." \
  -m "Changes:
- render watchlist rows as clickable active-state buttons
- forward watchlist symbol intents from the Svelte shell to the workbench controller
- add browser coverage for opening SPX from the watchlist" \
  -m "Verification:
- pnpm check (PASS)
- pnpm test:visual -- tests/visual/phase-one-harness.spec.ts -g \"watchlist symbol\" (PASS)" \
  -m "Not included:
- no multi-chart target routing
- no saved layout persistence"
```

## Task 5: Documentation, Tutorial, And Repo Verification

**Files:**

- Modify: `docs/tradingview-alignment-plan.md`
- Create: `tutorials/commit/0278-add-workbench-host-adapter-symbol-open.md`

- [ ] **Step 1: Add implementation note to the alignment plan**

Add this under `docs/tradingview-alignment-plan.md` section `### 1. Workbench Host Adapter`, after the Acceptance list:

```md
Implementation note:

- The first executable slice should land the public host adapter and fixture-driven watchlist symbol-open path before saved layouts, indicator catalog, or alerts.
```

- [ ] **Step 2: Write the commit tutorial**

Create `tutorials/commit/0278-add-workbench-host-adapter-symbol-open.md`:

```md
# 0278: 添加 Workbench Host Adapter 与 Watchlist Symbol Open

这次把 Workbench 从静态 demo 往真实 workstation 推了一步。

以前 watchlist 只是 `chartx-demo.ts` 里硬编码的展示数据。点击列表不会打开 symbol，页面也没有统一的 host adapter 边界。这样继续做 saved layout、indicator catalog 或 alerts 时，很容易继续把产品逻辑塞进 demo page。

这次新增的边界是：

- public `WorkbenchHostAdapter`
- fixture host adapter
- controller-level `openSymbol`
- Svelte watchlist click forwarding

## 1. 为什么先做 host adapter

TradingView-like workstation 的核心不是“页面上多几个按钮”，而是宿主能明确提供：

- symbol metadata
- watchlist rows
- chart-ready bars
- later persistence and alert providers

所以第一步要先建立 adapter，而不是直接在 Svelte 里写点击后换数据。

## 2. 这次具体改了什么

- 新增 `src/lib/chartx/public/workbench-host.ts`，定义 symbol resolve、bar loading、open-symbol helper。
- 新增 `src/lib/demo/workbench-fixtures.ts`，把 demo 的 watchlist 和 market bars 放到 fixture host adapter 后面。
- 更新 `src/lib/demo/chartx-demo.ts`，让 workbench controller 维护 active symbol 和 active payload。
- 更新 `MarketWorkbenchPanel.svelte`，让 watchlist row 成为可点击按钮并显示 active state。
- 更新 `+page.svelte`，只做 shell-level forwarding，不拥有 symbol-open policy。

## 3. 这次没有做什么

没有实现 saved layout。当前 active symbol 还不会跨刷新保存。

没有实现 multi-chart routing。watchlist click 仍然只打开当前 single workbench chart。

没有接真实行情源。当前 adapter 是 deterministic fixture adapter。

## 验证

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts tests/unit/workbench-contract.test.ts`
- `pnpm test:visual -- tests/visual/phase-one-harness.spec.ts -g "watchlist symbol"`

## 未包含

- 真实 market data adapter
- saved layout persistence
- indicator catalog
- alerts
- multi-chart target routing
```

- [ ] **Step 3: Run full verification for this slice**

Run:

```bash
pnpm check
pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts tests/unit/workbench-contract.test.ts
pnpm test:visual -- tests/visual/phase-one-harness.spec.ts -g "watchlist symbol"
pnpm build
```

Expected: all PASS.

- [ ] **Step 4: Commit docs and tutorial**

Run:

```bash
git add docs/tradingview-alignment-plan.md tutorials/commit/0278-add-workbench-host-adapter-symbol-open.md
git commit -m "docs(chartx2-workbench): document host adapter symbol-open slice" \
  -m "Record the workstation slice that moves watchlist symbol open through a typed host adapter so the roadmap and tutorial match the implemented boundary." \
  -m "Changes:
- add an implementation note to the TradingView alignment plan
- add a beginner-facing tutorial for the workbench host adapter slice" \
  -m "Verification:
- pnpm check (PASS)
- pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts tests/unit/workbench-contract.test.ts (PASS)
- pnpm test:visual -- tests/visual/phase-one-harness.spec.ts -g \"watchlist symbol\" (PASS)
- pnpm build (PASS)" \
  -m "Not included:
- no saved layout implementation
- no real market data provider"
```

## Final Verification

After all tasks are complete, run:

```bash
pnpm check
pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts tests/unit/workbench-contract.test.ts
pnpm test:visual -- tests/visual/phase-one-harness.spec.ts -g "watchlist symbol"
pnpm build
git status --short
```

Expected:

- `pnpm check` PASS
- focused unit tests PASS
- focused visual test PASS
- `pnpm build` PASS
- `git status --short` shows no unstaged or uncommitted changes

## Self-Review

Spec coverage:

- `WorkbenchHostAdapter`: Task 1
- fixture/local adapter: Task 2
- watchlist symbol open: Task 3 and Task 4
- page shell does not own policy: Task 4
- documentation and tutorial: Task 5
- saved layout, indicator catalog, alerts, object tree, multi-chart, replay, screener, and platform features are intentionally out of scope for this first executable plan

Deferred-marker scan:

- No deferred-marker terms are used.
- Every code-creation step includes concrete file content or concrete snippets to apply.
- Each test step has an exact command and expected result.

Type consistency:

- `WorkbenchHostAdapter`, `WorkbenchBarsPayload`, `WorkbenchOpenSymbolIntent`, and `WorkbenchOpenSymbolResult` are defined in Task 1 before they are imported later.
- `activeWatchlistItemId` is added to `ChartWorkbenchModelInput` before the controller passes it.
- `openSymbol` is added to `DemoController` before `+page.svelte` calls it.
