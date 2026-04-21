# 0206 - Move Secondary Add To Source Owner

## 背景

`chart-harness` 已经把 secondary factory deps 暴露交给 `chart-source-owner`，但真正执行 secondary add 的 helper 还留在 harness：

```ts
private addSecondarySeries(...)
```

这意味着 secondary/study attach orchestration 的 ownership 仍然分裂：

- factory deps 在 source owner
- add use-case 调用在 harness

后续继续收 source/series runtime 时，这个分裂会让边界不清楚。

## 本次改动

把 `addSecondarySeries` integration 移到 `chart-source-owner`。

source owner 现在直接暴露：

```ts
owner.addSecondarySeries(...)
```

它内部复用已有 `createSecondarySeriesFactoryDeps()`，继续调用原来的 leaf use-case：

```ts
chart-secondary-series-factory.addSecondarySeries(...)
```

## 对 harness 的影响

`chart-harness` 删除了 `addSecondarySeries` private method。

public secondary add commands 和 line-study helper 现在调用：

```ts
this.sourceOwner.addSecondarySeries(...)
```

这样 secondary/study attach policy 进一步归到 source owner，harness 只保留 public command target routing 和少量 study preset 参数。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-source-owner chart-secondary-series-factory chart-secondary-series-api chart-add-commands chart-state-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-source-owner.ts tests/unit/chart-source-owner.test.ts docs/chart-workstation-architecture.md tutorials/commit/0206-move-secondary-add-to-source-owner.md`

## Not included

- 没有改 secondary API factory behavior。
- 没有改 study target resolution。
- 没有改 restore ordering。
