# 0200 - 删除 Secondary Plain-Series Wrapper

## 背景

上一刀已经把 secondary add wiring 集中到 `addSecondarySeries`。

这次继续删除普通 secondary series 的 one-shot wrappers：

- candlestick
- line
- area
- baseline
- bar
- histogram
- volume

这些 wrapper 只服务 public add 方法，不被 restore/state deps 复用。

## 改动

- public `add*Series` 的 secondary path 直接调用 shared `addSecondarySeries`。
- `addLineSeries` 的 secondary path 直接调用仍被复用的 `addStudyLineSeries(paneId, "series")`。
- 删除普通 secondary add wrapper family。
- 保留 `addStudyLineSeries`、`addCompareStudySeries`、`addMovingAverageStudySeries`，因为它们仍被 public API 和 state restore deps 共同使用。
- 架构文档补充 secondary plain-series routing 不应保留 one-shot wrapper。

## 为什么没有行为变化

底层仍然走同一个 shared integration point：

```ts
this.addSecondarySeries({ paneId, kind, createApi })
```

target resolution、pane selection、API factory deps 都没有变化。

## 这一刀的价值

### 1. public add path 更直接

普通 secondary series 的 kind 和 API factory 现在直接写在 public add 方法里，不再跳到另一个没有 policy 的私有 wrapper。

### 2. 留下的 wrapper 都有复用理由

剩下的 study wrapper 是 public API 和 restore/state deps 的共享入口，不再和 one-shot wrapper 混在一起。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-add-commands chart-secondary-series-factory chart-secondary-series-api chart-source-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts docs/chart-workstation-architecture.md tutorials/commit/0200-remove-secondary-plain-add-wrappers.md`

## 还没做

- 没有删除 study wrapper。
- 没有改 target resolution。
- 没有改 secondary API factory deps。
