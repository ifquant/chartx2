# 0207 - Move Line Study Add To Source Owner

## 背景

上一刀已经把 generic secondary add 移到 `chart-source-owner`：

```ts
sourceOwner.addSecondarySeries(...)
```

但 `chart-harness` 还剩一个参数化 helper：

```ts
addLineStudySeries(...)
```

它只是在 `addSecondarySeries` 上固定 `kind: "line"`，给 overlay / compare / moving-average / plain secondary line 复用。

## 本次改动

把 `addLineStudySeries` 也移到 source owner。

`chart-harness` 的 public add commands 和 state restore deps 现在直接调用：

```ts
this.sourceOwner.addLineStudySeries(...)
```

## 为什么这样更清楚

line study attach 仍然属于 source/study lifecycle：

- 创建 secondary line API
- 分配 study meta
- 注册 study source
- 带上 studyKind / indicator metadata

这些都应该走 source owner，而不是 harness-local helper。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-source-owner chart-secondary-series-factory chart-secondary-series-api chart-add-commands chart-state-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-source-owner.ts tests/unit/chart-source-owner.test.ts docs/chart-workstation-architecture.md tutorials/commit/0207-move-line-study-add-to-source-owner.md`

## Not included

- 没有改 overlay / compare / moving-average target defaults。
- 没有改 moving-average default length。
- 没有改 secondary API behavior。
