# 0178 - 删除 Render Coordinator 抽出后的旧透传层

## 背景

`chart-render-coordinator` 已经接管了整帧渲染和 readout 组装：

- pane 内容渲染
- price/time axis 派发
- readout series 组装
- render tail 的 readout/crosshair 发布

但 `chart-harness` 里还残留了一组旧方法和 imports。它们已经不再参与真实 policy，只是把调用转给 `renderCoordinator`，或者保留着 coordinator 内部已经使用的 leaf module import。

这类遗留代码会让后续读代码的人误以为 harness 仍然直接拥有 render/readout/axis pipeline。

## 改动

- 删除 render/readout 相关的无引用 private wrapper：
  - `renderSeriesSource`
  - `buildReadoutSeriesForPrimary`
  - `buildReadoutSeriesForPane`
  - `buildMainBarSequence`
  - `buildReadout`
  - `buildRawReadout`
  - `formatSeriesReadoutValueForState`
- 把仍然需要 readout / main bar sequence 的调用点直接改成调用 `renderCoordinator`：
  - interaction handler 的 `buildReadout`
  - `getPointCount()` 里的 main sequence 查询
- 删除 `chart-harness` 里已经不再使用的 render/readout/axis leaf imports。
- 在架构文档里补充一条原则：render coordinator 稳定后，harness 不应该继续持有 coordinator 内部 leaf module 的 import ownership。

## 为什么这不是行为修改

这次没有改 `chart-render-coordinator` 的实现，也没有改 canvas render 入口。

运行路径仍然是：

```ts
public render(canvas: HTMLCanvasElement): void {
  this.renderCoordinator.render(canvas);
}
```

区别只是旧的 harness-local 中转方法被删掉，剩余调用点直接依赖 coordinator 的稳定表面。

## 这一刀的价值

### 1. 减少错误的职责信号

如果 harness import 了 `chart-axis-render`、`chart-pane-render`、`chart-readout-series` 这类 leaf module，读者会自然以为 harness 仍在拼装渲染管线。

删除这些 import 后，职责边界更清楚：

- frame pass 归 `chart-render-coordinator`
- harness 只保留 composition root 和 public adapter 的入口

### 2. 让下一步 owner deps 收口更干净

依赖组装还没有全部抽走，但先删掉无效 import/wrapper 后，剩下的高噪音区域更少。后续再抽 owner deps factory 时，不会把已失效的 render/readout 分支一起搬走。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-render-coordinator chart-readout chart-readout-series chart-readout-format chart-render-tail chart-interaction-handlers`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 没有抽 owner deps factory。
- 没有改 render coordinator 的内部实现。
- 没有调整 visual/e2e spec，只保留现有 render/readout 单测覆盖。
