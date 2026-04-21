# 0192 - 抽出 Series Label Formatting

## 背景

`chart-harness` 里还保留着 `formatSeriesKindLabel`。它负责把内部 kind 转成展示标题，例如：

- `candlestick` -> `Candlestick`
- `line-break` -> `Line Break`
- `point-figure` -> `Point Figure`

这个函数被 series builder 和 drawing owner 共同使用，不应该继续作为 harness-local helper。

## 改动

- 新增 `chart-series-labels.ts`，导出 `formatSeriesKindLabel`。
- `chart-harness` 改为导入该 helper，并继续把它传给 series/drawing builder deps。
- 删除 harness 底部的本地 `formatSeriesKindLabel`。
- 增加 `chart-series-labels.test.ts`，覆盖常见 chart/series kind 和 unknown fallback。
- 架构文档补充 series-kind label formatting 应离开 harness。

## 为什么没有行为变化

映射表原样移动，unknown kind 仍然 fallback 到：

```ts
"Series"
```

调用路径也没有变化：harness 仍然在 composition root 里把 formatter 传给现有 owner/builder。

## 这一刀的价值

### 1. label policy 有独立归属

series meta、series label、drawing title 都依赖同一套 kind label，独立模块比 harness-local helper 更清楚。

### 2. harness 底部 presentation helper 继续减少

这类纯展示映射没有 runtime 状态，搬出 harness 风险低，同时减少后续读 harness 时的噪音。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-series-labels chart-series-builders chart-drawing-owner chart-drawing-state`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-series-labels.ts tests/unit/chart-series-labels.test.ts docs/chart-workstation-architecture.md tutorials/commit/0192-extract-series-label-formatting.md`

## 还没做

- 没有改 series/drawing title 文案。
- 没有改 series meta allocation。
- 没有改 drawing owner 接口。
