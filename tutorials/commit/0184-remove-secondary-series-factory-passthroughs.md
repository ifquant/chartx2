# 0184 - 删除 Secondary Series Factory 的 Harness 透传层

## 背景

`chart-source-owner` 已经暴露了 secondary series factory deps：

```ts
this.sourceOwner.createSecondarySeriesFactoryDeps()
```

但 `chart-harness` 里仍保留一个纯转发方法：

```ts
private createSecondarySeriesFactoryDeps() {
  return this.sourceOwner.createSecondarySeriesFactoryDeps();
}
```

同样，series formatter options 也还通过 harness-local wrapper 再转到 `applySeriesFormatterOptionsUseCase`。

这两个 wrapper 都不承担 policy，只增加跳转层。

## 改动

- 所有 secondary series 创建路径直接调用 `this.sourceOwner.createSecondarySeriesFactoryDeps()`。
- primary/secondary series API deps 中的 formatter options 直接调用 `applySeriesFormatterOptionsUseCase`。
- 删除 harness-local wrapper：
  - `createSecondarySeriesFactoryDeps`
  - `applySeriesFormatterOptions`
- 在架构文档中补充 secondary series factory deps 的 ownership 规则。

## 为什么没有行为变化

之前路径：

```ts
this.createSecondarySeriesFactoryDeps()
  -> this.sourceOwner.createSecondarySeriesFactoryDeps()
```

现在路径：

```ts
this.sourceOwner.createSecondarySeriesFactoryDeps()
```

formatter options 同理，只是去掉 harness 中转。

## 这一刀的价值

### 1. secondary series attach 入口更直接

后续如果继续收 `addSecondary*Series`，调用点已经直接依赖 source owner 的稳定 surface。

### 2. 减少 harness 假职责

`chart-harness` 不再看起来像 secondary factory deps 或 formatter mutation 的 owner。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-source-owner chart-secondary-series-factory chart-primary-series-factory chart-series-presentation`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 没有重构 `addSecondary*Series` 方法族。
- 没有改 secondary series API shape。
- 没有改 formatter use-case 行为。
