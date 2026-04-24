# 添加 Workbench Screener V0

## 背景

Workbench 前面已经补上了 watchlist symbol open、saved layout、alerts、multi-chart layout 和 bar replay 这些工作台切片。接下来需要一个最小但真实的 Screener 入口，让右侧 sidebar 不只是静态信息卡，而是能基于当前 demo 数据给出一组可点击的候选 symbol。

这次 0284 的目标不是做完整市场扫描器，而是把 Screener V0 落在现有 workbench 边界里：

- screener 只是右侧 sidebar 的一个 panel
- 数据只来自现有 watchlist / fixture symbols
- 过滤只做少量本地 toggle
- 结果点击复用现有 symbol open 路径

这样先把 TradingView-like workstation 里的“筛选并跳转 symbol”链路打通，再决定后面要不要接远端行情、筛选表达式和保存方案。

## 为什么先做 sidebar screener，而不是单独做一个大页面

这一步最重要的不是“筛选器能写多复杂”，而是先确认 Screener 在 workstation 里的归属。

如果现在就单独做一页或做一套自己的 symbol 打开逻辑，很容易出现几个问题：

- screener 会绕开 workbench 的 active host 路由，点结果时和 watchlist 走两套行为。
- `+page.svelte` 会重新变胖，开始自己判断结果点击应该怎么开图。
- 右侧 sidebar 会继续只是展示层，workbench contract 反而缺一个真实的 screener panel model。
- 后续要做 saved screens 或 remote feed 时，很难看清哪些是公共 shell contract，哪些只是 demo 临时拼接。

所以这次先把 Screener V0 放进 `rightSidebar.screener`。这样它和 watchlist、alerts、object tree 一样，都是工作台 shell 的一部分，而不是页面额外分支。

## public shell 这次增加了什么

这次公开 contract 的重点不是“完整筛选语言”，而是一个很薄的 screener panel model：

- title / summaryLabel
- modeLabel
- filters
- results
- emptyLabel

`src/lib/chartx/public/workbench.ts` 负责把这些字段纳入 `rightSidebar`，因此 Svelte 面板只消费公开模型，不需要知道 demo controller 内部怎么算结果。

这层设计的意义是：以后就算把本地 fixture 换成真正的 screener provider，或者把 filter 从两个 toggle 扩展到更多条件，panel 的基本位置和对外 contract 也已经是稳定的。

## demo controller 怎么构造 Screener V0

Screener V0 完全基于现有 watchlist / fixture symbols 构造结果，没有引入第二套 symbol universe。

controller 的做法是：

1. 读取现有 workbench watchlist。
2. 基于每个 symbol 的 demo payload 生成确定性的 screener candidate。
3. 应用两个本地 filter：
   - `falling-only`
   - `price floor`
4. 按绝对涨跌幅排序，生成 screener rows。
5. 把结果投影到 `createChartWorkbenchModel({ screener })`，交给右侧 sidebar 渲染。

这里最关键的是“确定性”。

因为这还是 demo-local slice，如果 screener 排名和结果数量会随机漂移，browser test 就会很脆弱，文档也很难描述清楚当前行为。所以这次故意只使用现有 fixture + 固定过滤逻辑，让结果、数量和排序都能被稳定验证。

## filter 为什么只保留两个 toggle

这次只保留：

- 只看下跌
- 价格下限

原因不是这些筛选最强，而是它们足够证明三件事：

1. screener 结果不是静态列表，而是会随着 panel state 改变。
2. filter state 可以留在 demo/controller 层，不需要把复杂查询语法塞进 public contract。
3. 浏览器测试可以稳定断言结果数量和指定 symbol 的出现/消失。

如果一开始就做 query DSL、指标筛选或复杂组合条件，这个 slice 会马上从“workbench sidebar integration”膨胀成“市场扫描产品设计”，边界会变得很差。

## 点击结果为什么必须复用现有 open-symbol 路径

Screener V0 最容易做坏的地方，就是给结果点击偷偷开一条新路。

当前代码里 watchlist 已经通过 workbench controller + active host routing 打开 symbol。Multi-Chart Layout V0 之后，这条路径已经不再只是“改主图 symbol”，而是明确针对 active host 生效。

因此 screener result click 必须复用同一条路径，理由很直接：

- active host 语义只能有一套。
- activity log 的打开行为要保持一致。
- 以后 search/watchlist/screener 都应该只是不同入口，不应该是不同 routing policy。

这也是为什么 `src/routes/+page.svelte` 在这次里继续保持薄壳。页面只转发 screener result click，不自己决定 symbol open 细节。真正的打开语义仍然留在 controller。

## 这次切片实际达成了什么

结合当前实现，可以把 Screener V0 总结成下面这条完整链路：

- public workbench shell 暴露了一个薄的 `rightSidebar.screener` 模型
- demo controller 用 watchlist symbols 构造确定性的 local movers 结果
- panel 支持 `falling-only` 和 `price floor` 两个 toggle
- 结果按绝对涨跌幅排序
- 点击 screener row 会通过既有 symbol-open / active-host 路由打开对应 symbol
- `+page.svelte` 仍然只是 forwarding shell

这说明 Screener 已经不是 roadmap 里的空占位，而是一个真实可交互的 workstation panel。

## 这次明确没有做什么

这次故意不做下面这些能力：

- remote screener feed
- query DSL
- 用户自定义筛选表达式
- saved screener presets
- 多 watchlist / 多 universe 管理
- 大规模指标筛选目录
- 独立 screener 页面或完整表格产品

这些能力都可能存在，但应该建立在这次已经确认的边界之上，而不是回头把 screener 重新做成一套脱离 workbench 的页面逻辑。

## 验证

- Screener V0 的 runtime / UI 切片在前序任务里已经有 `tests/unit/workbench-contract.test.ts` 和 `tests/visual/phase-one-harness.spec.ts` 的覆盖，包含 screener panel contract、filter toggle 和 result click 打开 symbol 的路径。
- 本次 docs/tutorial wave 按要求只运行 `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`，结果 PASS。

## 未覆盖项

- 本次没有修改任何 runtime 或 UI 代码，只补齐 Screener V0 的计划文档、alignment note 和 0284 教程。
- 没有重新运行 `pnpm check`、unit test、Playwright 或 build，因为这次提交范围仅限文档。
