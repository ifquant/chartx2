# 0197 - 抽出 DOM Guards

## 背景

`chart-harness` 底部最后还剩一个 DOM guard：

```ts
assertCanvasElement(...)
```

它用于 `attach` 和 `createPhaseOneChart` 的入口校验。这个校验属于 shell/browser boundary，不是 chart runtime policy。

## 改动

- 新增 `chart-dom-guards.ts`，导出 `assertCanvasElement`。
- `chart-harness` 改为导入该 guard。
- 删除 harness-local `assertCanvasElement`。
- 增加 `chart-dom-guards.test.ts`，用 mock `HTMLCanvasElement` 覆盖通过和错误路径。
- 架构文档补充 DOM boundary guards 应离开 harness。

## 为什么没有行为变化

错误信息保持不变：

```ts
chartx phase-one chart requires an HTMLCanvasElement
```

调用点也保持不变：

- `PhaseOneChartHarness.attach`
- `createPhaseOneChart`

这次只是移动 guard 定义位置。

## 这一刀的价值

### 1. harness 底部 helper 基本清空

此前底部已经移走 demo data、pane chrome drawing、readout dispatch；这次把 DOM guard 也移走。

### 2. public shell 边界更明确

canvas element 校验是 public shell 输入校验，独立模块比 harness-local helper 更合适。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-dom-guards chart-canvas-lifecycle-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-dom-guards.ts tests/unit/chart-dom-guards.test.ts docs/chart-workstation-architecture.md tutorials/commit/0197-extract-dom-guards.md`

## 还没做

- 没有改 attach/detach lifecycle。
- 没有改 public chart API wrapper。
- 没有改 canvas runtime event binding。
