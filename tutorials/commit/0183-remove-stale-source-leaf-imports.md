# 0183 - 删除 Source Owner 收口后的旧 Leaf Imports

## 背景

前几刀已经把 source / series 的访问、mutation、study attach 等路径收进 `chart-source-owner`。

删除 wrapper 后，`chart-harness` 顶部还残留了一些旧 imports：

- `chart-main-series-switch`
- `chart-source-runtime`
- 部分 `chart-main-source-runtime`
- 旧的 `attachStudySource`
- 未使用的 `refreshTradeLocationRuntime`

这些 import 已经没有引用，但继续保留会传递错误信号：看起来 harness 还直接依赖这些 leaf runtime。

## 改动

- 删除 `setChartTypeUseCase` import。
- 删除旧 `chart-source-runtime` import block。
- 删除未使用的 main-source runtime imports：
  - `getMainSourceUseCase`
  - `getMainSourceOrThrowUseCase`
- 删除未使用的 `attachStudySource`。
- 删除未使用的 `refreshTradeLocationRuntime`。

## 为什么没有行为变化

这次是 import-only cleanup。所有被删除的 symbol 在 `chart-harness` 内都没有引用。

真实运行路径仍然通过：

- `sourceOwner.setChartType`
- `sourceOwner.getMainSource`
- `sourceOwner.getMainSourceOrThrow`
- `sourceOwner.refreshTradeLocation`
- `sourceOwner` 内部的 source runtime helpers

## 这一刀的价值

### 1. import ownership 和 runtime ownership 对齐

如果一个 leaf helper 已经变成 owner 内部依赖，就不应该继续出现在 harness imports 里。

### 2. 后续读 diff 更干净

后续继续抽 source deps factory 或 public adapter shell 时，顶部 imports 不再混入已经失效的历史依赖。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts docs/chart-workstation-architecture.md tutorials/commit/0183-remove-stale-source-leaf-imports.md`

## 还没做

- 没有改变 source owner 内部实现。
- 没有改 public API。
- 没有继续抽 source deps factory。
