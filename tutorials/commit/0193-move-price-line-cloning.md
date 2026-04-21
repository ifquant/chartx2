# 0193 - 移动 Price-Line Cloning 到 Runtime

## 背景

`chart-harness` 里还剩一个 price-line 相关 helper：

```ts
clonePriceLines(...)
```

它用于 main-series 切换时保留原有 price lines，并为 preserved state 创建新的 map 和 line object。这个逻辑属于 price-line runtime bookkeeping，不应该继续留在 harness 底部。

## 改动

- 在 `chart-price-line-runtime.ts` 中导出 `clonePriceLines`。
- `chart-harness` 改为从 price-line runtime 导入该 helper。
- 删除 harness-local `clonePriceLines`。
- 扩展 `chart-price-line-runtime.test.ts`，确认 clone 后 map 和 line object 都不共享。
- 架构文档补充 price-line clone policy 应离开 harness。

## 为什么没有行为变化

clone 规则原样移动：

```ts
new Map(Array.from(lines.entries(), ([id, line]) => [id, { ...line }]))
```

这仍然保留同一个 line id，同时避免 preserved state 和原 source 共享同一个 mutable line object。

## 这一刀的价值

### 1. price-line ownership 更完整

创建、API wrapper、active/remove 校验已经在 price-line runtime/manager，clone policy 也应该归到同一组模块。

### 2. main-series switch wiring 更干净

harness 现在只把 `clonePriceLines` 传给 source owner/factory，不再定义 price-line map-copy 行为。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-price-line-runtime chart-primary-series-factory chart-main-series-source`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-price-line-runtime.ts tests/unit/chart-price-line-runtime.test.ts docs/chart-workstation-architecture.md tutorials/commit/0193-move-price-line-cloning.md`

## 还没做

- 没有改 price-line API 行为。
- 没有改 main-series switch preserved-state shape。
- 没有移动 price-line manager。
