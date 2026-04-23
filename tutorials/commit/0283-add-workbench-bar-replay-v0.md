# 添加 Workbench Bar Replay V0

## 背景

TradingView 式工作台如果要变成日常分析工具，Replay 迟早要出现。但 `chartx2`
当前阶段还没有准备好一口气把 “active chart replay”、“多图同步 replay”、
“指标和绘图在 replay 下的完整语义” 一起做完。

所以这次 0283 只做一个很克制的 V0：

- 只支持当前 active market chart
- 只使用本地 fixture/history bars
- 只提供 enter / play / pause / step / exit
- 退出 replay 后恢复完整当前数据集

这一步的重点不是“把未来所有 replay 需求都承诺掉”，而是先让 workbench
真的具备一个可执行的 replay 通路。

涉及的实现位置：

- public shell contract: `src/lib/chartx/public/workbench.ts`
- demo controller/runtime: `src/lib/demo/chartx-demo.ts`
- workbench UI: `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- page shell forwarding: `src/routes/+page.svelte`
- tests:
  - `tests/unit/workbench-contract.test.ts`
  - `tests/visual/phase-one-harness.spec.ts`

## 为什么 V0 不先扩 engine API

Replay 很容易让人第一反应是：“是不是应该先在 chart engine 里加一套 replay
API，比如 play、pause、cursor、window？”

这次没有这么做，原因很直接：

- 当前 `chartx2` 的 replay 需求还停留在 workbench 层的首个可执行切片
- engine 目前已经有完整的 chart rebuild / setData / chart type / pane / drawing
  路径，足够承接一个 demo 级 replay
- 如果现在就把 replay API 压进 engine，很容易把还没稳定的 replay 语义过早固化成
  public contract

所以 V0 反而选择一个更谨慎的做法：

1. 保持 engine API 不变。
2. 在 demo controller 里维护 replay state。
3. 通过截断当前显示 payload 的方式，把 chart 重建到 replay cursor 对应的位置。

这意味着 replay 的第一版是 “workbench runtime policy”，不是新的 engine
兼容层。

## 这版 replay 到底怎么工作

`src/lib/demo/chartx-demo.ts` 现在维护了 replay 的几项核心状态：

- `replayActive`
- `replayPlaying`
- `replayCursor`
- `replayTimer`

active dataset 仍然是完整的 `activeBarsPayload`，但真正供当前图表使用的数据改成了
一个派生结果：

- 正常模式：直接返回完整的 `activeBarsPayload`
- replay 模式：只返回 `bars/line/volume` 到 `replayCursor` 为止的前缀

然后 `workbenchSeries(...)`、当前 close/time 读取、compare/overlay 的数据输入，
都统一改成读这个“当前显示 payload”。

这样做的结果是：

- replay 不需要发明新的 engine 控制面
- 现有的主图、volume pane、study pane、readout、alerts 评估入口都能跟着当前显示窗口走
- exit replay 只要回到完整 payload，再走一次现有 rebuild 即可

这就是为什么这次实现的关键不是“新增 replay render pipeline”，而是“把显示数据源
抽成一个会随 replay cursor 变化的 payload”。

## 为什么 replay 只做 active chart

上一轮 `Multi-Chart Layout V0` 已经把 workbench 带到一个 shell-first 的状态：

- split layout 有 host shell
- active host 路由是真实的
- 但当前仍然只有一个 live chart runtime / canvas

在这个前提下，Replay V0 如果再去做多图同步，就会立刻引入几个更大的问题：

- 哪个 host 是 replay owner
- 非 active host 要不要也维护 replay cursor
- split shell 和未来多 runtime replay 的边界应该放在哪
- saved layout 和 replay state 是否需要一起持久化

所以这次明确只支持 active chart replay。

这和 `Multi-Chart Layout V0` 的路线是一致的：先把真实的单点能力做通，再继续扩
host/runtime 维度，而不是把多层难题绑在同一个 commit 里。

## UI 和 page shell 为什么只负责转发

`src/routes/+page.svelte` 这次没有学 replay 策略，只新增了几条 callback 转发：

- `enterWorkbenchReplay`
- `playWorkbenchReplay`
- `pauseWorkbenchReplay`
- `stepWorkbenchReplay`
- `exitWorkbenchReplay`

真正的 replay policy 仍然在 `chartx-demo.ts`：

- 什么时候允许开始 replay
- replay cursor 如何推进
- play timer 如何清理
- 退出 replay 后怎么恢复完整数据

`MarketWorkbenchPanel.svelte` 只负责：

- 渲染 replay summary
- 渲染 replay controls
- 触发 controller callback

这点很重要。Replay 虽然是工作台功能，但策略不应该漏到 `+page.svelte` 里，否则
页面壳会再次变成事实上的业务中心。

## 为什么要阻止 replay 中的 save/restore/reset

这次有一个刻意的 guard：

- replay active 时，save / restore / reset layout 会被拒绝

原因不是“功能做不出来”，而是要先保护 saved-layout 语义。

如果 replay active 仍然允许保存布局，那么当前 chart 的 snapshot 很可能只是一个
被 replay cursor 截断后的状态。这样保存出来的 layout 看上去像正常布局，实际上却
偷偷带入了 replay 窗口，这是危险的。

所以 V0 先做保守策略：

- replay 期间不允许 layout persistence 动作
- 用户先退出 replay，再做 save/restore/reset

这比“看起来能点、但其实把 replay 截断状态当正常布局保存了”要诚实得多。

## 当前切片没有承诺什么

这次 0283 不应该被表述成“Replay 已经完全对齐 TradingView”。还差很多：

- 没有 multi-chart replay sync
- 没有 symbol / interval / crosshair 联动 replay
- 没有云端 replay state
- 没有策略回测或订单模拟
- 没有稳定承诺 indicator / drawing 在 replay 下的完整语义

尤其最后一条要说清楚：

当前 replay 是通过现有 rebuild 路径完成的，所以它已经能显示 replay 中的图表窗口，
但这不等于已经为所有 indicator/drawing 建立了严格的 replay 生命周期约束。

## 验证

本次实现实际运行的检查：

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check` (PASS)
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-contract.test.ts` (PASS)
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench replays|layout"` (PASS)
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check` (PASS)

## 未覆盖项

- 本次不新增 engine replay API。
- 本次不做多图 replay 或 replay sync。
- 本次不把 replay state 纳入 saved-layout 持久化。
- indicator / drawing 在 replay 下的稳定语义仍然是后续切片，而不是本次 V0 已完成能力。
