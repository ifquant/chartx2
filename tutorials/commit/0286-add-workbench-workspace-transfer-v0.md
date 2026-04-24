# 添加 Workbench Workspace Transfer V0

## 背景

`0285` 把 command palette 落下后，`Workstation UX And Command Surface` 这一层还剩几个很明显的空洞：

- workbench 还没有真正可用的 workspace tabs
- layout 只有 save / restore / reset，没有 import / export
- 成功和失败状态大多只落在 activity log，没有薄的 shell status surface

这次 0286 把这三个相邻点一起收了一轮，但没有另起一套大架构。核心原则是继续复用已经存在的 contract，而不是为了“功能更完整”再发明第二套模型。

## 为什么 workspace tabs 先做成 focus tabs

这里最容易走偏的地方，是把 `workspace tabs` 直接理解成 TradingView 那种完整的多文档工作区系统。

如果现在就去做：

- 多文档 tab 管理
- tab 级保存和关闭
- 跨 tab runtime 持有
- tab 间共享 / 独立 symbol 策略

那这一轮会立刻从“shell UX 收口”变成“多 runtime 工作区架构”。这和当前 Layer 2 的目标不匹配。

所以这次只把 tabs 做成 `workspace focus`：

- `Trade`
- `Scan`
- `Alerts`
- `Inspect`

它们做的事很克制：

- 切换当前强调的 right sidebar panel
- 同步当前强调的 bottom tab
- 被 command palette 和 layout snapshot 一起看见

这一步先把“工作台焦点模式”做实，后面如果真的要走到完整的 workspace documents，也能在这层之上迭代，而不是推翻页面结构。

## 为什么 import/export 必须复用 `WorkbenchLayoutState`

repo 里在 saved layout 那轮其实已经定义了 `WorkbenchLayoutState`，而且里面连 `panels.rightSidebar` 和 `panels.bottomTab` 这种字段都预留了。

如果这次为了 export/import 图省事，再写一份新的 ad-hoc JSON，比如：

- 当前 symbol
- 当前 timeframe
- chart state
- 再随手拼一点 panel state

那后面马上会出现两套 layout snapshot：

- persistence provider 的 saved layout
- import/export 的 JSON layout

两套 schema 一旦分叉，后面每加一个 workstation field 都要同步维护两份兼容性逻辑。这是纯负担。

所以这次的决定很明确：导出和导入都直接复用 `WorkbenchLayoutState`。

这带来三个直接好处：

1. save / restore / import / export 讲的是同一类 layout snapshot。
2. workspace focus 这种新状态可以顺手收进现有 `panels` 字段。
3. 校验逻辑已经有 `isWorkbenchLayoutState(...)`，import 不需要再手写一套脆弱的 JSON 检查。

## controller 和 page 的职责怎么分

这次另一个需要守住的边界，是文件 I/O。

浏览器里的下载和上传本来就带有平台壳层性质，所以：

- `+page.svelte` 负责 hidden file input 和浏览器 download
- `chartx-demo.ts` 负责导出什么、如何验证导入 JSON、如何恢复状态

也就是说，页面层只做：

- 触发选择文件
- 读取文件文本
- 创建下载 blob
- 把原始文本交给 controller

真正的业务判断仍然在 controller：

- replay 中是否允许 import/export
- JSON 是否符合 `WorkbenchLayoutState`
- chart type 是否受支持
- 应该如何走现有 symbol-open / chart-state restore 路径
- 成功和失败应该显示什么 status notice

这很重要，因为如果把导入校验逻辑塞回页面层，`+page.svelte` 又会开始重新持有 workstation policy。

## 这次 public shell 增加了什么

`src/lib/chartx/public/workbench.ts` 这次新增的是很薄的 projection models：

- `workspaceTabs`
- `activeRightSidebarPanel`
- `layoutTransfer`
- `statusNotice`

这些字段只表达 shell 应该怎么画，不表达行为实现。

比如：

- 哪个 tab active
- 当前强调哪个 sidebar panel
- import/export 按钮是否可用
- 当前状态提示是 success / warning / error

至于“为什么不可用”“导入后怎么恢复 chart state”，都不在 public shell 里判断。

## demo controller 实际做了什么

`src/lib/demo/chartx-demo.ts` 这轮新增了三类能力：

1. workspace focus state
   - `setWorkspaceTab(...)`
   - command palette 里也能切换 workspace focus
   - focus 会映射到 right sidebar panel 和 bottom tab

2. layout transfer
   - `exportLayout()`
   - `importLayout(raw)`
   - 都复用 `WorkbenchLayoutState`

3. thin status surface
   - 成功、warning、error 通过 `statusNotice` 发给 shell
   - replay guard、schema 校验失败、restore 成功这些状态都能直接被 UI 看见

这里最关键的一点，是 import 不是偷偷改几个字段，而是继续走已有恢复链路：

- 校验 JSON
- 解析 chart type
- 通过现有 symbol open path 打开 symbol / timeframe
- 应用 chart state snapshot
- 再同步 workspace focus

这样 import 和 restore 的语义保持在同一条主线上。

## 这次 UI 上真实得到的东西

从用户视角，这轮最直观的变化有四个：

- toolbar 多了 `Import layout` / `Export layout`
- 顶部多了 workspace focus tabs
- sidebar 四个主面板现在有一个明确的 focus 状态
- 成功或失败会在 toolbar 下方出现清晰 status notice

同时，这些状态不是只存在 UI 里：

- command palette 可以切 workspace focus
- export 下来的 JSON 会记住当前 focused right sidebar panel
- import 回来之后，symbol 和 focus 都会恢复

这说明它已经不是“看上去像有 tabs 和按钮”，而是状态链路确实贯通了。

## 这次明确没有做什么

这次故意没有做下面这些更大的能力：

- 完整多文档 workspace tabs
- cloud workspace sync
- import/export alerts / watchlists / full workbench session
- layout snapshot 冲突合并
- fuzzy command search
- command history
- 自定义快捷键

这些都可能是后续需要的，但不能在这一步把 `Workstation UX` 直接推成一整套 workspace platform。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-contract.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "workspace tabs|layout import/export|command|screener|workbench replays|layout"`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 这次 tabs 只是 workspace focus，不是完整多文档 tab 系统。
- import/export 仍然只处理 `WorkbenchLayoutState`，还没有扩展到 alerts、watchlists 或完整 workstation session。
