# 0009 补最小 public chart API 的 happy path 测试

## 背景

前面已经把 model、renderers、浏览器 harness、resize baseline 和一组有限 parity contract tests 补起来了，但 phase-one checklist 里还有一块空着：`minimal public chart API` 还没有真正被测试过。

如果 public surface 只有 `mount harness` 这种宿主页专用入口，后面很难判断：

- host shell 是不是仍然只通过 public boundary 使用图表
- chart 创建、加系列、喂数据、首帧渲染这条路径是否真的成立
- 错误的宿主输入有没有明确失败方式

## 主要目标

把 public API 从“只有宿主页 mount helper”推进到“有一条很窄但可测试的 chart 创建路径”，并补上对应 happy path / invalid host tests。

## 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)，增加 `createPhaseOneChart`
- 更新 [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)，公开 `createChartxPhaseOneChart`
- 新的 phase-one API 只允许：
  - 创建一个 chart
  - 添加一个 candlestick series
  - 通过 `setData` 写入数据
  - `destroy`
- 对不支持的 API 宽度显式拒绝，例如重复添加第二个 candlestick series
- 新增 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)，覆盖：
  - `create chart -> add series -> set data -> first render`
  - 非 `canvas` 宿主的失败路径
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md) 和 [src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts)，同步 API 阶段状态

## 关键知识

为什么这一步不直接把 `lightweight-charts` 的完整 public API 面抄过来？因为 phase one 现在需要的是一条可验证的最小路径，而不是先把 API 壳做大。

`create chart -> add series -> set data -> first render` 这条路径一旦站住，后面再扩 API，至少知道自己是在往真实工作流上加能力，不是在设计空气接口。

## 补充知识

- 对图表引擎来说，public API 不是“等内部稳定再考虑”的装饰层。只要宿主已经开始使用图表，边界就已经是事实，最好尽早收窄并测试。
- “显式拒绝不支持的宽度” 比“先默默兼容一部分、以后再说”更健康。后者最容易把 phase-one 的最小 API 养成一个含糊不清的半成品。

## 验证

- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有 crosshair 或 viewport update snapshot
- 还没有 pan / zoom 交互测试
- 还没有更宽的 public API 覆盖，例如多系列或多 pane
