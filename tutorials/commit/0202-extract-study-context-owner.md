# 0202 - Extract Study Context Owner

## 背景

`chart-harness` 还保留着两个 source/study 相关 private methods：

- `syncChartContextFromMainSource`
- `resolveStudyDisplayData`

这两个方法表面上只是转发 use-case，但实际把几件 runtime policy 绑在 harness 里：

- 主图 source 变化后如何 bind / clear chart context
- study 数据如何根据当前 chart context 重算
- price-based 主图下 plain study series 如何 merge 到 chart context
- moving-average / compare study 如何处理 requested context
- context 变更后如何触发 trade-location refresh

这些都属于 source/study runtime ownership，不应该继续表现为 harness-local helper。

## 本次改动

新增 `chart-study-context-owner.ts`，集中承接：

- `resolveDisplayData`
- `syncStudyData`
- `syncMainSource`

owner 内部继续复用已有 leaf use-case：

- `chart-study-context.resolveStudyDisplayData`
- `chart-study-context.syncStudyContextData`
- `chart-main-source-runtime.syncChartContextFromMainSource`
- `chart-main-source-runtime.createMainBarSequenceFromSource`

## 对 harness 的影响

`chart-harness` 删除了：

- `studyMergeEngine` 字段
- `syncChartContextFromMainSource` private method
- `resolveStudyDisplayData` private method

source owner、primary factory、state coordinator、secondary mutation deps 现在都通过：

```ts
this.studyContextOwner.resolveDisplayData(...)
this.studyContextOwner.syncMainSource(...)
```

这样 harness 仍然提供 chart model / refresh wiring，但不再直接拥有 study context policy。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-study-context-owner chart-study-context chart-main-source-runtime chart-source-owner chart-render-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-study-context-owner.ts tests/unit/chart-study-context-owner.test.ts docs/chart-workstation-architecture.md tutorials/commit/0202-extract-study-context-owner.md`

## Not included

- 没有改 study merge policy。
- 没有改 moving-average 计算规则。
- 没有改 trade-location runtime 算法。
