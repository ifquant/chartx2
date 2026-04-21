# 0180 - 删除 Source Owner 稳定后的死 Source Runtime Wrapper

## 背景

`chart-source-owner` 已经接管了 source / study 访问路径：

- typed source lookup
- compare study lookup
- moving average study lookup
- secondary scale attach
- secondary series API deps 组装

这次发现 `chart-harness` 里还剩三个无调用 private helper：

- `getCompareStudyState`
- `getMovingAverageStudyState`
- `getOrCreateSecondaryPanePriceScale`

这些方法以前属于 source accessor/runtime 收口前的中间层。现在它们已经没有调用点，继续保留只会让 harness 看起来还在拥有 study specialization 和 secondary-scale access policy。

## 改动

- 删除 `chart-harness` 里的三个无调用 source runtime wrapper。
- 删除对应的 `chart-source-runtime` imports：
  - `getCompareStudyStateRuntime`
  - `getMovingAverageStudyStateRuntime`
  - `getOrCreateSecondaryPanePriceScaleRuntime`
- 在架构文档里补充 source owner 的 import / wrapper ownership 原则。

## 为什么没有行为变化

这次删除的是无调用 private 方法。实际 compare / moving-average API 仍然走 `chart-source-owner` 内部的 accessor：

```ts
const getCompareStudyState = (api: unknown) =>
  getCompareStudyStateUseCase(api, {
    getSourceByApi: ...
  });
```

也就是说，真实运行路径已经在 owner 里，harness 这三个方法只是旧代码遗留。

## 这一刀的价值

### 1. source owner 边界更清楚

删除之后，读者不会再误以为 study specialization 还需要回到 harness 查找。

### 2. 为后续 source deps 收口减少噪音

后面如果继续抽 source owner deps factory，剩下的 source 相关代码会更接近真实依赖，而不是混着已经失效的历史 helper。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-source-owner chart-source-runtime chart-secondary-series-factory`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 没有移动 source owner deps assembly。
- 没有改 primary/secondary data mutation 行为。
- 没有改 compare / moving-average study public API。
