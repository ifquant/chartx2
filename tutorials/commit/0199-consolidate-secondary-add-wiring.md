# 0199 - 收拢 Secondary Add-Series Wiring

## 背景

secondary/study add-series wrapper 还不能直接删除，因为同一组方法同时被 public API 和 owner deps 复用。

但每个 wrapper 都重复同一件事：

```ts
addSecondarySeriesUseCase(params, this.sourceOwner.createSecondarySeriesFactoryDeps())
```

这个重复会让 harness 里 secondary add wiring 看起来比实际更复杂。

## 改动

- 增加一个 harness-local `addSecondarySeries` 集成点。
- 所有 secondary/study wrapper 改为只传入 kind、studyKind、indicator 和 API factory。
- 删除每个 wrapper 内重复的 `this.sourceOwner.createSecondarySeriesFactoryDeps()` handoff。
- 架构文档补充 secondary add-series wiring 应共享一个 factory deps integration point。

## 为什么没有行为变化

底层仍然调用同一个 use-case：

```ts
addSecondarySeriesUseCase(...)
```

factory deps 仍然来自：

```ts
this.sourceOwner.createSecondarySeriesFactoryDeps()
```

这次只是把重复的 handoff 集中到一个私有方法。

## 这一刀的价值

### 1. secondary add wrappers 更聚焦

每个 wrapper 现在只表达该 series/study 的 kind 和 API factory。

### 2. 后续迁出更容易

未来如果把 secondary add family 移到 owner/composition module，只需要替换一个 shared integration point，而不是多个重复 call site。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-secondary-series-factory chart-secondary-series-api chart-source-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts docs/chart-workstation-architecture.md tutorials/commit/0199-consolidate-secondary-add-wiring.md`

## 还没做

- 没有删除 secondary/study wrapper 方法。
- 没有改 API factory deps shape。
- 没有改 target resolution behavior。
