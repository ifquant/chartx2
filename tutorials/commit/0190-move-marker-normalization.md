# 0190 - 移动 Marker Normalization 到 Series Presentation

## 背景

`chart-harness` 里还剩一个 marker 相关底部 helper：

```ts
normalizeMarkers(...)
```

它负责给 marker 补默认值，并按 time/text 排序。这个逻辑实际属于 series presentation，而不是 harness runtime。

## 改动

- 在 `chart-series-presentation.ts` 中新增 `normalizeSeriesMarkers`。
- 导出 `SeriesMarkerState`，让 harness 继续使用同一组 marker runtime shape。
- `chart-harness` 的 primary/secondary marker mutation wiring 改为调用 `normalizeSeriesMarkers`。
- 删除 harness-local `normalizeMarkers` helper。
- 扩展 `chart-series-presentation.test.ts`，覆盖 marker 默认值和排序规则。
- 架构文档补充 marker normalization 应属于 series presentation。

## 为什么没有行为变化

默认值保持不变：

- `position`: `aboveBar`
- `shape`: `circle`
- `color`: `#2563eb`
- `text`: 空字符串

排序规则也保持不变：

```ts
left.time - right.time || left.text.localeCompare(right.text) || 0
```

这次只是把算法从 harness 搬到 presentation module。

## 这一刀的价值

### 1. presentation ownership 更完整

formatter patch、marker mutation、readout formatting 已经在 `chart-series-presentation`，marker normalization 也应该跟它们放在一起。

### 2. harness 少一个底部 policy helper

harness 现在只负责把 `normalizeSeriesMarkers` 传入 mutation use-case，不再定义 marker 默认样式和排序策略。

### 3. 后续 source owner 更容易收口

source owner 依赖中的 marker mutation 现在可以直接依赖 presentation module，减少未来从 harness 拆 deps 时的粘连。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-series-presentation chart-source-owner chart-primary-series-factory`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-series-presentation.ts tests/unit/chart-series-presentation.test.ts docs/chart-workstation-architecture.md tutorials/commit/0190-move-marker-normalization.md`

## 还没做

- 没有改 marker public API。
- 没有改 marker render behavior。
- 没有继续调整 source owner dependency shape。
