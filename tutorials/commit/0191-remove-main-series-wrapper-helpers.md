# 0191 - 删除 Main-Series Factory 的局部 Wrapper

## 背景

`chart-harness` 里还剩几个没有独立 policy 的 wrapper：

- `seriesKindForMainChartType`
- `applyMainSeriesTypeSpecificOptions`
- `rendererForSeriesKind`

其中前两个只是转调已有 model/use-case；第三个已经没有调用点。

## 改动

- primary series factory deps 直接调用 `mainSeriesKindForChartType`。
- primary series API deps 直接调用 `applyMainSeriesStyleOptions`。
- 删除 unused `rendererForSeriesKind`。
- 删除 `seriesKindForMainChartType` 和 `applyMainSeriesTypeSpecificOptions` 两个 harness-local passthrough。
- 架构文档补充 main-series factory wiring 应继续删除无 policy wrapper。

## 为什么没有行为变化

原先 wrapper 的实现是直接转发：

```ts
return mainSeriesKindForChartType(type);
return applyMainSeriesStyleOptions(source.styleSchemaId, source, options);
```

现在调用点直接执行同一个函数。`rendererForSeriesKind` 已经没有调用点，删除它不会影响运行路径。

## 这一刀的价值

### 1. harness 少几个伪 ownership 函数

这些 wrapper 会让读代码的人误以为 harness 还拥有 chart-type mapping 或 style patch policy。

### 2. factory deps 更直接

primary series factory 的依赖现在直接指向实际 owner/use-case，后续再收 source owner deps 时更容易看清真实边界。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-primary-series-factory chart-primary-series-api chart-series-builders`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts docs/chart-workstation-architecture.md tutorials/commit/0191-remove-main-series-wrapper-helpers.md`

## 还没做

- 没有改 main-series style patch behavior。
- 没有改 chart-type mapping。
- 没有继续移动 series label helper。
