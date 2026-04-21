# 0203 - Remove Secondary Study Add Wrappers

## 背景

前两轮已经把 secondary plain-series add 路径收到了同一个 integration point：

```ts
this.addSecondarySeries(...)
```

但 study 路径还保留了三个 harness-local wrapper：

- `addStudyLineSeries`
- `addCompareStudySeries`
- `addMovingAverageStudySeries`

这些 wrapper 没有额外状态或 restore 语义，只是给 `addSecondarySeries` 预设 `kind`、`studyKind`、`indicator` 和 API factory。

## 本次改动

删除这三个 one-shot wrapper，并保留一个参数化的 `addLineStudySeries` integration helper。

调用点现在显式传入 study kind、indicator metadata 和 API factory：

- public `addLineSeries` 的 secondary 分支
- public `addOverlaySeries`
- public `addCompareSeries`
- public `addMovingAverageStudy`
- chart state restore deps 里的 overlay / compare / moving-average add 回调

## 为什么这样更好

现在 harness 只剩一个 secondary add integration point，外加一个非 one-shot 的 line-study 参数化入口：

```ts
private addSecondarySeries(...)
private addLineStudySeries(...)
```

所有 secondary series / study attach 都显式声明：

- pane id
- series kind
- study kind
- indicator metadata
- API factory

这比一组名字相近的 private wrappers 更容易审查，也让后续如果继续把 secondary add composition 移到 source owner，迁移点更集中。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-add-commands chart-secondary-series-factory chart-secondary-series-api chart-state-coordinator chart-source-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts docs/chart-workstation-architecture.md tutorials/commit/0203-remove-secondary-study-add-wrappers.md`

## Not included

- 没有改 study target resolution。
- 没有改 compare 或 moving-average options。
- 没有改 state restore ordering。
