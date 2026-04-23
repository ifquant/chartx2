# 添加 Workbench Object Tree V0

## 背景

TradingView 的工作台里，Object Tree 和 Inspector 的价值在于把 “图上有什么” 变成可浏览、可定位、可管理的对象列表，而不是只能靠画布 hit-test 和记忆来维护复杂图表。

本次 0281 记录的是 Object Tree 的 V0 切片：先把 “公共工作台模型” 和 “demo 投影” 跑通，做到可测试的只读树形列表，但暂时不引入对象选择、折叠、或任何会反向驱动 chart runtime 的操作。

涉及的代码位置（都以当前实现为准）：

- public workbench model: `src/lib/chartx/public/workbench.ts`
- demo projection: `src/lib/demo/chartx-demo.ts`
- UI: `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- browser tests: `tests/visual/phase-one-harness.spec.ts`

## 为什么 V0 必须只读

Object Tree 一旦允许点击选择、折叠、隐藏、删除，就会立刻要求 “节点 id 能稳定映射回 runtime 对象”，并且要求 “UI 操作必须通过明确的 owner/service 调用”，不能靠页面临时逻辑直接改内部状态。

在 chartx2 当前阶段，这两个前提都还不够稳：

- chart runtime 的对象图仍然以 `PhaseOneChartStateSnapshot` 为中心做快照/回放式的观察，很多对象身份还没有形成可长期承诺的 public identity。
- workbench 的 public 合约目前更偏向 “UI 可用的投影模型”，而不是 “可写的对象管理 API”。

因此 V0 选择只读：先把 “看见什么” 做成确定性的 contract，再在后续切片里把 selection 和 mutating operations 放进专门的 workbench owner 层。

## public model 和 chart runtime state 的差异

### public model 不是 runtime graph

`src/lib/chartx/public/workbench.ts` 里的 `ObjectTreePanelModel` 和 `WorkbenchObjectTreeNodeModel` 是 UI-facing 的投影：

- `nodes` 是线性列表，每个节点只有 `label/detailLabel/badgeLabel/muted/depth`。
- `id` 是 UI 侧使用的字符串标识，并不承诺能直接定位到 engine 内部对象实例。
- `depth` 只是渲染层级提示（用于 `aria-level` 和缩进），不包含折叠状态或 children 指针。

这和 chart runtime 的内部状态不同。runtime 里真正的对象数据来自 `PhaseOneChartStateSnapshot`（例如 series/study/drawing 列表、每个对象的 options/state、pane 归属等），它的目的首先是快照与还原，而不是为工作台 UI 提供可写的对象管理 API。

### V0 的 id 是 “可测试的 UI key”，不是可写对象句柄

V0 的节点 id 目前主要服务于 UI 渲染稳定性和浏览器测试定位，例如：

- `chart:active`
- `pane:<paneIndex>`
- `series:<index>` / `study:<index>` / `drawing:<index>`
- `alert:<alertId>`

这些 id 让测试可以用 `data-object-tree-kind` + 文案断言 “树里出现了什么”，但它们还不足以支撑 “点击树节点就选中画布对象” 这种双向绑定。

## demo projection 是怎么做的

demo controller 在 `src/lib/demo/chartx-demo.ts` 里做了两步投影，然后把结果塞进 public workbench model：

1. 从 chart runtime 抽取 “可读的对象统计信息”：
   - `refreshObjectTreeProjection()` 读取 `chart?.getChartState()`，通过 `projectWorkbenchObjectTreeChartState(...)` 把 `PhaseOneChartStateSnapshot` 变成更小的 `WorkbenchObjectTreeChartProjection`（主图类型、renderer、series kind + 点数、studies、drawings 的 paneIndex/visible、trade location 等）。
   - 同时把 `chart.panes()` 的 pane state 做快照，并用 `paneSnapshotWithProjectedCounts(...)` 把 pane 的 `seriesCount/seriesKinds` 和投影后的对象数量对齐，保证 sidebar 里的 pane 行可以有一致的 detail 文案。
2. 构建可渲染的 tree nodes：
   - `buildWorkbenchObjectTree(...)` 接收 `panes + chartProjection + alerts`，生成 `ObjectTreePanelModel`：
     - root node: chart
     - pane nodes: 主 pane / 次 pane
     - main-series/series/study/drawing 节点按投影列表追加
     - alert 节点直接从 workbench alerts runtime list 追加（因此 object tree 会反映 “创建 alert 后新增节点”）
   - 生成的 `objectTree` 作为 `createChartWorkbenchModel({ objectTree, ... })` 的输入，最终落在 `workbench.rightSidebar.objectTree`。

这个结构的关键点是：Object Tree V0 不把 chart runtime 对象直接暴露给 UI，只暴露 “稳定、可测试的投影”。

## UI 如何保持只读 tree 语义

`src/lib/demo/components/MarketWorkbenchPanel.svelte` 渲染 object tree 的方式是刻意保持只读的：

- container 使用 `<ul role="tree" aria-label="Workbench object tree">`
- 每个节点用 `<li role="treeitem" aria-level=... aria-selected="false">`
- 节点没有 `on:click`、没有 selection state 绑定、也没有 `aria-expanded`

因此 V0 只保证：

- DOM 语义上是 tree/treeitem，便于后续补键盘导航和可访问性。
- 浏览器测试可以通过 role 查询 + `data-object-tree-kind` 断言节点出现与否。

## 哪些操作被刻意延后

以下都不是 V0 目标，本切片不做承诺：

- 选择：点击 treeitem 联动到 chart runtime selection（drawing/series/study）。
- 折叠：pane 下的 children 折叠/展开（需要 `aria-expanded` + 可维护的 children 结构）。
- 管理操作：hide/show、rename、remove、reorder、move-to-pane。
- 双向定位：从 object tree 定位到画布 viewport、或从画布 selection 反向高亮 treeitem。
- 稳定 identity：为 series/study/drawing 建立跨 restore 的稳定 id，并形成可写的 owner/service API。
- inspector 集成：把 object tree selection 作为 inspector 路由入口（当前 inspector 仍以 drawing hit-test/selection 为主）。

## 验证

本提交为 docs/tutorial 切片，但会按计划要求跑完整 final verification：

- `pnpm check` (PASS)
- `pnpm test:unit -- tests/unit/workbench-contract.test.ts` (PASS)
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "object tree"` (PASS)
- `pnpm build` (PASS)
- `git diff --check` (PASS)

## 未覆盖项

- 本次不新增任何 object tree 的交互行为；UI 仍保持只读列表。
- 本次不改变 public contract 的 shape；selection/collapse 等操作需要新的 workbench owner 层来承接，不能直接把 demo logic 写进 Svelte 面板。

