# 0205 - Extract Runtime Query Owner

## 背景

`chart-harness` 还保留两个小 private methods：

- `getPointCount`
- `assertSeriesActive`

它们看起来很短，但都是横跨多个 runtime surface 的查询：

- pointer / wheel / scale API 都需要 point count
- primary / secondary series API 都需要 active-series guard

这些查询不应该继续表现为 harness 自己的 runtime policy。

## 本次改动

新增 `chart-runtime-query-owner.ts`，集中承接：

- `getPointCount`
- `assertSeriesActive`

owner 内部继续复用已有 point-count use-case，并由 harness 注入：

- main bar sequence builder
- chart context snapshot
- source list
- source API active check

## 对 harness 的影响

`chart-harness` 删除了 `getPointCount` 和 `assertSeriesActive` 两个 private methods。

调用点改为：

```ts
this.runtimeQueryOwner.getPointCount()
this.runtimeQueryOwner.assertSeriesActive(api)
```

这样 input/scale/series API 依赖的是一个 runtime query surface，而不是 harness-local helper。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-runtime-query-owner chart-point-count chart-input-runtime chart-pointer-runtime chart-scale-commands chart-primary-series-api chart-secondary-series-api`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-runtime-query-owner.ts tests/unit/chart-runtime-query-owner.test.ts docs/chart-workstation-architecture.md tutorials/commit/0205-extract-runtime-query-owner.md`

## Not included

- 没有改 point-count 计算规则。
- 没有改 removed-series error message。
- 没有改 input/scale interaction behavior。
