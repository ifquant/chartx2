# 添加 Workbench Command Surface V0

## 背景

前面的 workbench 切片已经把 layout、saved layout、alerts、object tree、bar replay 和 screener 这些能力逐步接进来了，但入口仍然比较分散。用户要么点 toolbar 按钮，要么点 sidebar 项，要么在不同卡片里找对应操作。下一步如果想继续往 TradingView-like workstation 靠，必须先把“常用动作有统一入口”这件事做实。

这次 0285 选择的不是一口气做完整命令系统，而是先落一个 `Command Surface V0`：

- public shell 暴露一个薄的 `commandPalette`
- demo controller 发布一组确定性的命令项
- `Cmd/Ctrl+K` 可以打开和关闭 palette
- palette 执行现有 workbench 命令，而不是自己发明第二套业务逻辑

这样先把 command-driven workstation 的最小闭环做出来，再继续扩展搜索、工作区切换和导入导出。

## 为什么先做 deterministic palette，而不是 fuzzy search

如果一开始就做模糊搜索、分组结果、最近命令或命令别名，这个切片很容易从“把常用动作变成统一入口”膨胀成“完整命令中心产品设计”。

当前 repo 更缺的是稳定边界，而不是更复杂的搜索体验。所以这次故意只做一组显式命令：

- theme toggle
- single / split layout
- save / restore / reset layout
- replay enter / exit

这些命令都已经在现有工作台里有语义，只是以前分散在不同按钮或 controller 方法里。把它们收进一个确定性的 palette，有几个直接好处：

- browser test 可以稳定断言具体命令项和执行结果
- public contract 只需要很薄的 entry model，不会过早承诺搜索协议
- 后面就算换成 fuzzy search，这一层 command entry / execute 边界也还能复用

所以这一步的重点不是“搜得多聪明”，而是“命令是不是通过统一 contract 发布并执行”。

## public shell 这次增加了什么

`src/lib/chartx/public/workbench.ts` 这次增加的是一个很薄的 `commandPalette` 模型：

- `title`
- `entries`
- entry 的 `label`
- 可选 `shortcutLabel`
- `enabled`
- 可选 `active`

这层设计刻意保持克制。

它没有引入搜索输入框状态、过滤结果状态、最近使用记录或复杂分组，而是只让 shell 知道“当前有哪些命令，以及它们能不能执行”。这样 `MarketWorkbenchPanel.svelte` 可以只消费公开模型，而不需要知道 demo controller 内部到底是怎么把 layout/replay/theme 这些动作映射出来的。

## demo controller 为什么要自己发布 command registry

这次命令并不是写死在页面或 Svelte 组件里，而是由 `src/lib/demo/chartx-demo.ts` 发布。

原因很直接：workbench 的业务语义本来就已经在 controller 里。

比如：

- layout 单图 / 分屏切换本来就是 controller 的 action
- save / restore / reset layout 已经有现成方法
- replay enter / exit 也已经有明确入口
- theme 切换也已经通过 action 驱动

如果 palette 自己再维护一套“点按钮后要怎么改状态”的逻辑，就会出现两套行为来源。后面只要某个 action 语义调整，palette 和原 toolbar 很容易不同步。

所以这次的做法是：

1. controller 基于当前状态构造 palette entries。
2. entry 的 `enabled / active` 反映真实 runtime 条件。
3. `executeCommand(commandId)` 再路由回既有的 `runAction(...)`、layout persistence 方法和 replay 方法。

这样 palette 本质上只是现有 controller 能力的一层统一投影。

## 为什么 `+page.svelte` 只保留 open state 和键盘转发

这次最需要守住的边界，就是不要让 `+page.svelte` 再次变胖。

页面层现在只做两件事：

- 持有 palette 是否打开的瞬时状态
- 监听 `Cmd/Ctrl+K` 和关闭行为，然后把执行请求转发给 controller

真正的命令内容、是否 enabled、执行后该改哪些 runtime 状态，都不在页面里判断。

这样做的意义有两层：

- UI shell 仍然只是 shell，不重新变成工作台策略中心
- 命令入口以后可以从 overlay 扩展到 toolbar、context menu 或全局快捷键，但执行语义仍然是一套 controller 路径

这和前面几轮 workbench slice 的方向是一致的：`+page.svelte` 留作装配和 forwarding，不变成业务 owner。

## 这次实际做成了什么

结合当前实现，`Command Surface V0` 已经打通了下面这条链路：

- public workbench model 暴露 `commandPalette`
- demo controller 发布确定性的 command entries
- palette 支持 `Cmd/Ctrl+K` 打开和关闭
- overlay 里能看到当前命令的 enabled / active 状态
- 点击命令项会走 controller 的统一执行入口
- browser test 已覆盖键盘打开、关闭以及 layout command 的真实执行结果

这说明 workbench 已经不只是“按钮集合”，而是开始具备 command-driven workstation 的基础形态。

## 这次明确没有做什么

这次故意没做下面这些能力：

- fuzzy search
- free-text command parsing
- 自定义快捷键
- 最近命令 / 历史命令
- 工作区 tabs
- import / export flows
- 跨页面或跨 app 的全局 command bus

这些都可能是后续 TradingView-like 对齐里需要的能力，但它们应该建立在这次已经落下来的 command registry 和 controller execution boundary 之上，而不是先把 command surface 复杂化。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-contract.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "command|screener|workbench replays|layout"`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 这次没有做 fuzzy search、命令分组、命令历史和快捷键自定义。
- 这次也没有把 workspace tabs、import/export 或 error-state surface 收进 command palette；它仍然只是第一批常用命令的统一入口。
