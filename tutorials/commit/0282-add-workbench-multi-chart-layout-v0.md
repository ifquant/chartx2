# 添加 Workbench Multi-Chart Layout V0

## 背景

TradingView 式工作台最终一定会需要多图布局，但 `chartx2` 当前阶段还没有准备好一次性把 “多 host UI” 和 “多个真实 chart runtime 同时运行” 一起做完。

本次 0282 记录的是一个非常刻意的 V0 切片：先把 workbench 的多图布局外壳、slot/host contract、active-host 路由跑通，让页面知道 “当前在操作哪个 host”，但不假装已经做出了真正的多 runtime 并排图表系统。

这次文档要和当前实现保持一致，核心代码事实是：

- public contract 已经有 `layout preset`、`slot`、`chart host`、`activeChartHostId`
- demo workbench 已经能切到 split 布局，并显示 main/secondary 两个 host card
- watchlist open 与 save/restore/reset layout 已经按 active host 路由
- 但当前仍然只有一个 live chart runtime / canvas
- split 模式下，非激活 host 只是 shell summary，不是另一个正在运行的图表
- `grid-2x2` 目前只存在于 public model / UI contract 维度，不是已落地的真实四图 runtime

涉及的实现位置（按当前代码）：

- public workbench contract: `src/lib/chartx/public/workbench.ts`
- demo controller: `src/lib/demo/chartx-demo.ts`
- workbench UI: `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- visual coverage: `tests/visual/phase-one-harness.spec.ts`

## 为什么 V0 先做 shell，而不是直接做多 runtime

多图布局看起来像是纯 UI 需求，但真正难的是 runtime 边界。

如果一开始就做 “两个甚至四个 chart runtime 同时活着”，就会立刻碰到这些问题：

- 每个 host 要不要拥有独立的 `PhaseOneChartApi`、独立 canvas、独立订阅和独立 snapshot 生命周期
- watchlist open、layout restore、indicator 操作、drawing 操作到底命中哪个 host
- 保存布局时，保存的是 “工作台外壳状态” 还是 “每个 host 各自的 runtime snapshot”
- 后续 symbol link / timeframe sync / crosshair sync 应该挂在哪一层 contract，而不是临时塞进页面逻辑

这些问题如果在 contract 还不清楚时直接上多 runtime，很容易把 `+page.svelte` 或 demo controller 变成事实上的策略中心，后面再拆会很痛。

所以 V0 的顺序是反过来的：

1. 先定义多图工作台需要的 public shape。
2. 先让 shell 能表达 layout / slot / host / active host。
3. 先把 “动作路由到 active host” 做成可测试行为。
4. 再把真正的多 runtime 同时运行放到后续切片。

这就是为什么这次叫 shell-first。它不是偷懒，而是先把边界做对。

## public contract 现在到底提供了什么

`src/lib/chartx/public/workbench.ts` 里已经有 Multi-Chart 的基础 contract：

- `MultiChartLayoutPreset = "single" | "grid-2x2" | "main-plus-secondary"`
- `ChartHostModel` 描述 host 的 `id/family/title/slotId/active`
- `MultiChartLayoutModel` 描述 `preset/symbolMode/activeChartHostId/slots`
- `createChartWorkbenchModel(...)` 会把 host 归一化，并把 active host 显式写进 layout model

这里最重要的一点是：public contract 已经把 “pane” 和 “chart host” 分开了。

pane 是 chart runtime 内部的单图 pane 语义；host 是 workbench 外层的图表容器语义。这样后面做多图时，不会把 “四宫格里的四张图” 错当成 “一张图里的四个 pane”。

但也要实话实说：目前这个 contract 比执行层走得更远。

- `grid-2x2` 已经在 public model 和 unit test 里出现
- 但 demo controller 当前只实现了 `"single" | "main-plus-secondary"` 两种可操作 preset
- 所以 contract 已经为未来留口，但执行层还没有四图 runtime

## active-host routing 是怎么工作的

V0 最关键的真实能力不是 “屏幕上出现两个框”，而是 “工作台知道当前哪个 host 是 live 的”。

`src/lib/demo/chartx-demo.ts` 当前维护了两个 host record：

- `market-main`
- `market-secondary`

每个 record 保存的是 demo-local host state：

- `symbol`
- `timeframe`
- `chartType`
- `chartState`

同时 controller 维护：

- `layoutPreset`
- `activeChartHostId`

active host 切换流程是：

1. 切换前先把当前 live chart 的 symbol/timeframe/chartType/chartState 快照回当前 host record。
2. 把 `activeChartHostId` 切到目标 host。
3. 用目标 host record 里的 symbol/timeframe/chartType 重新打开当前唯一的 live chart。
4. 如果目标 host 有保存过 `chartState`，再把 snapshot 应用回这张 live chart。

也就是说，host activation 不是 “两张图都在跑，然后把焦点切过去”，而是 “把当前唯一 live runtime 重新绑定到另一个 host record”。

这正是当前实现必须说清楚的地方。

## 为什么 split 模式下仍然只有一个 live canvas

`src/lib/demo/components/MarketWorkbenchPanel.svelte` 已经把多 host shell 渲染出来了：

- split 模式下会渲染多个 `data-chart-slot`
- 每个 slot 会显示一个 `data-chart-host` card
- active host 会被打上 `data-chart-host-active="true"`

但真正的 live chart DOM 只有一份：

- UI 会额外渲染一个 `.live-chart`
- 这块 live chart 会被放到当前 active slot 对应的 grid 位置
- 实际 `<canvas aria-label="chartx2 phase-one chart harness">` 也只在这块 live chart 中存在一次

非激活 host 卡片显示的是摘要文本，其中明确写着：

- `This host is a shell in this slice.`

这句话不是装饰，而是当前架构事实的直接声明。split 模式下看到两个 host，不等于同时存在两个 live chart runtime。

所以现在的 split 更接近：

- 一个可见的多 host 布局外壳
- 一个会随 active host 移动的 live canvas
- 若干只读 host summary

而不是：

- 两个真实 chart runtime 同时渲染
- 各自独立响应交互
- 各自持续订阅和绘制

## watchlist 和 saved layout 为什么已经算真实进展

这个 V0 切片虽然没有完成真正的 multi-runtime，但 active-host 路由已经不是假 UI。

### watchlist open

`tests/visual/phase-one-harness.spec.ts` 已经覆盖了：

- split 布局下存在两个 host
- 先打开 main host
- 点击 watchlist 第一项后，symbol 会写到当前 active host
- 再切到 secondary host
- 点击另一项 watchlist 后，symbol 只更新 secondary host
- main host 的 symbol 保持不变

这说明 watchlist open 已经不再是 “永远改唯一那张图”，而是先经过 active host 决策。

### save / restore / reset layout

`src/lib/demo/chartx-demo.ts` 里对 layout persistence 还有一个很诚实的注释：

- `layout persistence is still active-host-only in this slice`

而实际日志也会在 split 模式下附带：

- `(active host only)`

这意味着保存、恢复、重置布局虽然已经进入 multi-host 语义，但当前保存的仍然只是 active host 的 chart snapshot 和相关状态，不是整个 split workbench 的完整多 host 布局。

所以这一步的价值是：路由边界先成立了；存储范围还没有扩到真正 multi-host。

## 为什么现在不能把它说成真正的 Multi-Chart

如果只看 UI，用户可能会觉得 “已经有 single / split / 甚至 contract 里还有 2x2，那不就是多图了吗？”

从实现角度，这样说会过头，原因有三类。

### 1. 没有同时存在的多个 runtime

当前 demo 只有一个 live `PhaseOneChartApi` 和一个 live canvas。host 切换时，本质是把这一个 runtime 的内容切换到另一个 host record，而不是维持多个 runtime 并排共存。

### 2. 2x2 还只是 contract 预留

`grid-2x2` 已经进入 public model 和 unit test，说明 contract 方向已经确认；但 demo action、controller 执行、真实四图布局行为并没有一起落地。

### 3. sync groups 还没开始

真正 TradingView 风格的多图布局，一般会继续要求：

- symbol linking
- interval linking
- crosshair sync
- 甚至 replay sync

这些都还没有进入当前 V0 的执行层。现在不要把 `symbolMode: "shared"` 这种字段误读成已经有完整 sync group 行为。

## 这次切片刻意延期了什么

以下内容都不是本次 0282 已完成能力，文档必须保持克制：

- 不存在真正的双 runtime 并排渲染
- 不存在真正的 2x2 runtime 布局
- 不存在多个 live canvas 同时交互
- 不存在 host 间的 symbol/timeframe/crosshair sync group
- saved layout 还不是完整 multi-host workspace snapshot
- 当前多 host 仍然局限在 demo-local market host 记录，不是通用 host runtime container

这些延后并不表示方向错误，反而说明 V0 的目标很清楚：先让 workbench 外壳和 active-host 路由成立，再继续往真实 multi-runtime 布局推进。

## 验证

按本任务要求，本次只运行：

- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check` (PASS)

## 未覆盖项

- 本次是 docs/tutorial 落点，不新增任何 multi-chart 执行代码。
- 本次不会把当前 split shell 描述成真正的 simultaneous multi-runtime 布局。
- 后续如果进入真实 multi-chart 阶段，应该优先补的是多 runtime/container 边界，而不是继续堆更多 shell 文案。
