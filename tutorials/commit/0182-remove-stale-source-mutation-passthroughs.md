# 0182 - 删除 Source Mutation 的 Harness 透传层

## 背景

`chart-source-owner` 已经接管了主图和副图数据更新：

- primary data replace/update
- histogram-like primary data replace/update
- secondary data replace/update
- histogram-like secondary data replace/update
- study attach 和 secondary API deps 组装

但 `chart-harness` 里还保留了一层旧 wrapper，例如：

```ts
private setPrimaryData(data: readonly PhaseOneCandlestickData[]): void {
  this.sourceOwner.setPrimaryData(data);
}
```

这类 wrapper 已经不是抽象层，只是把 source owner 的职责重新伪装成 harness-local method。

## 改动

- `setData()` / `update()` 直接调用 `sourceOwner`。
- primary series factory deps 里的 data mutation 回调直接调用 `sourceOwner`。
- 删除无调用或纯透传的 source mutation wrapper：
  - `setPrimaryData`
  - `updatePrimary`
  - `setPrimaryHistogramLikeData`
  - `updatePrimaryHistogramLike`
  - `attachStudySeries`
  - `createSecondarySeriesApiDeps`
  - `setSecondaryData`
  - `updateSecondary`
  - `setSecondaryHistogramLikeData`
  - `updateSecondaryHistogramLike`
- 删除对应的旧 runtime imports：
  - `chart-main-series-runtime`
  - `chart-series-mutation`
  - `attachStudySeries` / `createSecondarySeriesApiDeps` from `chart-secondary-series-factory`

## 为什么没有行为变化

实际 mutation 逻辑仍然在 `chart-source-owner` 中执行。路径从：

```ts
chart-harness wrapper
  -> sourceOwner
```

变成：

```ts
sourceOwner
```

也就是说，viewport reset、chart context sync、render invalidation 和 trade-location refresh 等行为仍由同一个 owner surface 触发。

## 这一刀的价值

### 1. source mutation ownership 更明确

数据变更不再表现为 harness 自己拥有的一组 `set/update` 方法。后续追踪数据生命周期时，入口集中在 source owner。

### 2. 清理过期 import ownership

`chart-harness` 不再直接 import main-series runtime 和 series mutation leaf helpers。这些 helper 已经成为 source owner 的内部依赖。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-source-owner chart-series-mutation chart-main-series-runtime chart-secondary-series-runtime chart-primary-series-factory`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 没有抽 `createSecondarySeriesFactoryDeps` 的调用聚合。
- 没有改 source owner 内部 mutation 行为。
- 没有改 public API shape。
