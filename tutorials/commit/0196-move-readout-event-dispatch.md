# 0196 - 移动 Readout Event Dispatch

## 背景

`chart-harness` 底部还剩一个 render tail 相关 helper：

```ts
emitReadout(...)
```

它只负责创建并 dispatch `chartx:readout` CustomEvent。readout 发布属于 render tail，而不是 harness runtime policy。

## 改动

- 在 `chart-render-tail.ts` 中新增 `emitReadoutEvent`。
- `chart-harness` 的 render coordinator deps 改为调用该 helper。
- 删除 harness-local `emitReadout`。
- 扩展 `chart-render-tail.test.ts`，覆盖 CustomEvent 类型和 detail payload。
- 架构文档补充 readout CustomEvent publication 应离开 harness。

## 为什么没有行为变化

事件名和 payload 保持不变：

```ts
new CustomEvent("chartx:readout", { detail })
```

render coordinator 的 `emitReadout(canvas, detail)` 接口也没有变化，只是 harness 提供的实现从本地 helper 换成 render-tail helper。

## 这一刀的价值

### 1. render tail ownership 更完整

`finishChartRender` 已经负责 readout/crosshair tail publication 顺序，CustomEvent dispatch 也应归到同一组 render-tail helper。

### 2. harness 少一个浏览器事件构造 helper

harness 继续收缩为 composition root，不再定义 `chartx:readout` 的 DOM event construction。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-render-tail chart-render-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-render-tail.ts tests/unit/chart-render-tail.test.ts docs/chart-workstation-architecture.md tutorials/commit/0196-move-readout-event-dispatch.md`

## 还没做

- 没有改 readout event name。
- 没有改 render coordinator interface。
- 没有移动 canvas element guard。
