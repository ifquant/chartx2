# 0186 - 删除末端事件和 Context Sync 的一行转发方法

## 背景

前面几刀删除了 owner surface 稳定后的 wrapper。继续扫描后，`chart-harness` 还剩几类末端一行方法：

- `createMainBarSequenceFromSource`
- `syncStudyContextData`
- `emitCrosshairMove`
- `emitChartTypeChange`

这些方法没有独立 policy，只是在 closure 里转给 use-case 或 handler registry。

## 改动

- render coordinator deps 直接调用 `createMainBarSequenceFromSourceUseCase`。
- `syncChartContextFromMainSource` deps 直接调用 `createMainBarSequenceFromSourceUseCase`。
- `syncChartContextFromMainSource` deps 内联调用 `syncStudyContextDataUseCase`。
- render coordinator deps 直接调用 `handlerRegistry.emitCrosshairMove(...)`。
- source owner chart-type switch deps 直接调用 `handlerRegistry.emitChartTypeChange(...)`。
- 删除对应 harness-local 一行转发方法。

## 为什么没有行为变化

之前路径：

```ts
this.emitCrosshairMove(readout)
  -> this.handlerRegistry.emitCrosshairMove(readout, this.viewState.crosshair())
```

现在路径：

```ts
this.handlerRegistry.emitCrosshairMove(readout, this.viewState.crosshair())
```

bar sequence 和 study sync 也是同样的转发层删除。

## 这一刀的价值

### 1. 剩余方法更能代表真实职责

删除这些一行转发后，`chart-harness` 里的 private method 列表更接近真实剩余复杂度。

### 2. 为下一步大粒度拆分做准备

后续如果抽 interaction/drawing drag 或 source deps factory，不会再混入这些已经没有职责的末端转发方法。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-source-owner chart-render-coordinator chart-study-context chart-main-source-runtime chart-handler-registry`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 没有改 handler registry。
- 没有改 context sync use-case。
- 没有抽 interaction / drawing drag 逻辑。
