# 0016 给 phase one 补最小 update 语义

## 背景

到这一步之前，`chartx2` 的图表内核虽然已经有：

- baseline render
- crosshair / zoom / pan
- host-level OHLC bar
- 最小 public chart API

但数据写入还只有 `setData`。这意味着它更像“能显示一批静态数据的 chart”，还不像“能继续接实时 bar 更新的 chart core”。

所以 phase one 里很值得先补一个窄的 `update` 路径。

## 主要目标

支持最小但明确的增量更新语义：

- 追加一根新 bar
- 替换最后一根 bar

除此之外的更复杂数据合并先显式不做。

## 改动概览

- 更新 [src/lib/chartx/internal/model/series-data.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/series-data.ts)，增加 `update`
  - 如果时间等于最后一根，替换最后一根
  - 如果时间晚于最后一根，追加新 bar
  - 如果时间早于最后一根，直接报错
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)，把 `update` 接到 phase-one series API
- 更新 [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)，覆盖 append、replace-last、reject out-of-order
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)，补 `setData -> update -> rerender` 的浏览器 happy path
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)、[src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，同步当前 phase-one floor

## 关键知识

为什么这里不先做完整 streaming data engine？因为 phase one 需要的不是把所有实时场景一次吃完，而是先把最常见也最能验证方向的一条数据语义站住。

对 K 线图来说，这条最常见路径就是：

- 最新 bar 还在形成中时，替换最后一根
- 新周期到了时，追加一根

## 补充知识

- 图表项目里的 `update` 语义非常容易越做越宽，所以越早把“不支持什么”写清楚越重要。否则后面所有人都会默认它已经支持更复杂 merge。
- 就算内部目前还是通过重建 rows 来完成 `update`，只要 public contract 先钉住，后面再优化实现也会更安全。

## 验证

- `pnpm test:unit` (`PASS`)
- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有更复杂的 partial backfill merge
- 还没有订阅式 streaming API
- 还没有 update 对时间轴标签或动画的更细粒度处理
