# 0198 - 删除 Primary Add-Series Wrapper

## 背景

`chart-harness` 里还保留了一组只调用一次的私有方法：

- `addPrimaryCandlestickSeries`
- `addPrimaryLineSeries`
- `addPrimaryAreaSeries`
- `addPrimaryBaselineSeries`
- `addPrimaryBarSeries`
- `addPrimaryHistogramSeries`

这些方法没有独立 policy，只是把固定 kind 传给 `addPrimarySeriesUseCase`。

## 改动

- public `add*Series` 的 `addPrimary` callback 直接调用 `addPrimarySeriesUseCase`。
- 删除 6 个 harness-local primary add wrapper。
- 架构文档补充 primary add-series routing 不应保留 one-shot wrapper。

## 为什么没有行为变化

原 wrapper 的实现保持不变，只是 inline 到原调用点：

```ts
addPrimarySeriesUseCase("line", this.createPrimarySeriesFactoryDeps())
```

target resolution、secondary fallback、primary factory deps 都没有变化。

## 这一刀的价值

### 1. public add-series routing 更直接

读 public add 方法时可以直接看到 primary path 调用的是 shared primary factory。

### 2. harness 方法列表更短

这 6 个方法只增加跳转层，没有额外语义。删除后后续更容易看清真正仍需 owner 化的方法。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-add-commands chart-primary-series-factory chart-primary-series-api`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts docs/chart-workstation-architecture.md tutorials/commit/0198-remove-primary-add-wrappers.md`

## 还没做

- 没有改 secondary add-series wrappers。
- 没有改 target resolution behavior。
- 没有改 primary factory deps shape。
