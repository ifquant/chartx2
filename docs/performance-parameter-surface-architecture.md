# Performance Parameter Surface Architecture

Date: 2026-04-16

This document defines the optimization and parameter-sweep chart line for `chartx2` performance analytics.

It is intentionally part of the performance domain, not the technical-analysis chart domain.

## Core Decision

Parameter-surface charts are performance analytics views over many strategy runs.

They are not:

- a main-series chart type
- a technical-analysis study
- a second time-price chart

The truth source is not `OHLCVBar[]`. The truth source is a parameter sweep or optimization result set.

```text
Parameter Surface
└─ ParameterSweepModel
   ├─ StrategyRunSummary(run 1)
   ├─ StrategyRunSummary(run 2)
   ├─ ...
   └─ StrategyRunSummary(run N)
```

Each run summary contains:

- a parameter assignment
- a metric bundle
- optional run period metadata

The surface view then chooses which two parameters form the horizontal plane and which metric becomes the vertical result.

## Why This Is A Separate Domain

Technical analysis charts are organized around:

- symbol
- bar sequence
- chart context
- panes
- price scales
- drawings and indicators

Parameter surfaces are organized around:

- parameter assignments
- many strategy runs
- optimization metrics
- robustness comparisons
- run selection and drilldown

This means the x/y/z semantics are different from market charts:

- `x` is a parameter
- `y` is a parameter
- `z` is a metric such as net profit, Sharpe, or drawdown

Later views may also use:

- color as a second metric
- point size as trade count or sample weight
- filters across the remaining parameters

Trying to force this into `TimeScaleModel` / `PriceScaleModel` would couple unrelated domains.

## Model Layer

The minimal source model is:

```ts
type ParameterValue = number | string | boolean;
type ParameterAssignment = Record<string, ParameterValue>;

type StrategyRunSummary = {
  runId: string;
  strategyId: string;
  scope: "strategy" | "trading" | "portfolio";
  params: ParameterAssignment;
  metrics: Partial<Record<OptimizationMetricKey, number>>;
  period?: {
    from: number;
    to: number;
  };
};

type ParameterSweepModel = {
  id: string;
  strategyId: string;
  name: string;
  parameterKeys: string[];
  runs: StrategyRunSummary[];
};
```

This intentionally uses `StrategyRunSummary`, not the full `StrategyRunModel`.

Reason:

- parameter surfaces usually need hundreds or thousands of runs
- the view only needs parameter assignments and summarized metrics
- the full run can be loaded lazily only after the user drills into one point

## Dataset Layer

The first stable dataset API should be a parameter surface dataset, independent of any 3D renderer:

```ts
type ParameterSurfaceSpec = {
  sweepId: string;
  xParam: string;
  yParam: string;
  zMetric: OptimizationMetricKey;
  colorMetric?: OptimizationMetricKey;
  filter?: ParameterAssignment;
};

type ParameterSurfaceDataset = {
  spec: ParameterSurfaceSpec;
  points: ParameterSurfacePoint[];
  xValues: ParameterValue[];
  yValues: ParameterValue[];
  zRange: { min: number; max: number } | null;
  colorRange: { min: number; max: number } | null;
};
```

This separation is deliberate:

- heatmap can consume it
- 2.5D heightmap can consume it
- scatter cloud can consume it
- real WebGL 3D surface can consume it later

Do not make the first implementation depend on a specific renderer.

## Product Rollout

### Phase 1: Heatmap

The first useful product is a 2D heatmap:

- x = parameter A
- y = parameter B
- color = metric
- hover = full parameter assignment + metrics
- click = locate run

This is enough to expose:

- profitable zones
- drawdown-heavy zones
- sharp peaks vs broad plateaus

It is cheaper and more readable than jumping directly to WebGL 3D.

### Phase 2: 3D Scatter / Surface

Once the dataset and drilldown contracts are stable, add:

- rotatable 3D scatter
- surface interpolation only when the data really forms a grid
- z metric switching
- optional color metric overlay

The renderer should remain a consumer of `ParameterSurfaceDataset`, not the source of truth.

### Phase 3: Robustness

The real value is not just “best run”, but “stable region”.

That means later support for:

- stability score
- neighbor smoothness
- walk-forward / out-of-sample overlays
- robustness filters

This should stay in the performance analytics line, not leak into market chart semantics.

## Drilldown Contract

Parameter surfaces do not link directly to a trade.

They link to a run first:

```text
Parameter Surface -> Run -> Trade -> Market Chart
```

The first contract is:

```ts
type RunLocationIntent = {
  kind: "locate-run";
  runId: string;
  strategyId: string;
  params: ParameterAssignment;
  sourceReportId: string;
};
```

Meaning:

- parameter surface chooses one run
- shell or report host opens that run’s performance report
- performance report then emits `TradeLocationIntent`
- market chart locates the selected trade

This keeps the domain boundaries clean:

- parameter sweep does not talk directly to market chart internals
- market chart does not need to understand optimization geometry

## Metric Policy

The parameter surface should not bias users toward a single “highest return” point.

The first metric set should include:

- `netProfit`
- `winRate`
- `avgTrade`
- `maxDrawdown`
- `profitFactor`
- `sharpe`
- `sortino`
- `tradeCount`
- `stabilityScore`

The important product principle is:

- surface must help find stable plateaus, not just isolated spikes

## Implementation Rules

- Keep all parameter-surface code under the performance domain.
- Do not reuse `TimeScaleModel` or `PriceScaleModel` as the domain model.
- Keep renderer-independent dataset contracts.
- Prefer deterministic sample sweep fixtures for testing and demo.
- Treat `RunLocationIntent` as the handoff boundary to performance report hosting.

## Immediate Next Step

The next implementation slice should be:

1. `ParameterSweepModel` and `StrategyRunSummary`
2. `OptimizationDatasetRegistry`
3. `RunLocationIntent`
4. deterministic sample sweep fixture
5. heatmap-first demo view

Do not jump directly to a 3D renderer before the dataset and drilldown contracts are stable.
