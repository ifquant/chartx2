# 0050: 把 chartx2 根页收成 Workbench + Features demo shell

这次提交不是继续在首页堆更多卡片，而是把 `chartx2` 的根页重新定义成一个真正的样例程序。

目标很明确：

- `Workbench`
  - 负责展示一个完整的、偏 TradingView 工作台感觉的例子
- `Features`
  - 负责按特性拆开，清楚展示当前 public chart API 已经能做什么

这样做之后，`chartx2` 不再只是“一个越来越复杂的首页”，而是“一个完整例子 + 一组特性例子”的统一 demo shell。

## 这次改了什么

### 1. 新增 demo composition 层

新增了：

- [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)

这里面只依赖：

- [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)

不会直接 import chart internals。

它负责：

- 定义 demo tabs 和 feature tabs
- 生成 demo 用样例数据
- 组合 `Workbench` chart
- 组合 `Series / Panes / Interactions / Scales / Data / Styling / Events` 的 feature demo
- 产出统一的 `actions + snapshot`，让页面壳只负责展示

这一步很重要，因为它把“图表组合逻辑”和“页面壳布局”拆开了。

### 2. 根页改成两级 tab shell

重写了：

- [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)

现在根页有两层：

- 顶层 tabs
  - `Workbench`
  - `Features`
- `Features` 里的二级 tabs
  - `Series`
  - `Panes`
  - `Interactions`
  - `Scales`
  - `Annotations`（暂时 disabled）
  - `Data`
  - `Styling`
  - `Events`

而且右侧不再是静态 watchlist 卡片堆，而是切到当前 demo 的 contextual panel：

- 当前 readout
- 当前 metrics
- 当前 event log
- 当前 note / gap

### 3. 保留 workbench 测试锚点

虽然页面结构改了，但还是保留了几个关键锚点：

- `.chart-frame`
- `.readout-bar`
- `chartx2 phase-one chart harness`
- `Phase-one floor is now carrying the first real pane architecture.`

这样旧的 harness 回归测试可以升级，而不是全部推翻重写。

### 4. 更新 visual regression

更新了：

- 现有 `Workbench` 快照
- 新增 `Features` 的三个基线
  - `Panes`
  - `Interactions`
  - `Series`

对应文件是：

- [tests/visual/phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)

### 5. 更新 gap 文档

更新了：

- [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)

现在这份文档不再只讲 engine gap，也明确区分：

- `Engine Gap`
- `Demo / Showcase Gap`
- `Deferred TradingView Workstation Gap`

这样后面就不会再把“图表引擎没做完”和“样例程序没展示清楚”混成一件事。

## 为什么这么做

因为 `chartx2` 的定位已经很清楚了：

- 它不是普通业务首页
- 它是图表系统的样例程序
- 长期目标是 TradingView 风格工作台

如果根页只是一页不断演化的 homepage，外部很难理解当前 chart surface 到底有多厚。

把它改成：

- 一个完整 workbench
- 一组分特性的 examples

就能同时解决：

- “它最终像什么”
- “它现在已经支持什么”

## 验证

实际跑过：

- `pnpm check`
- `pnpm test`
- `pnpm build`

## 给新人的 2 个补充知识点

### 1. demo shell 和 chart engine 最好分层

即使同一个仓库同时有“图表引擎”和“样例程序”，也最好让样例程序只走 public API。

原因很简单：

- 这样 demo 更像真实用户集成
- 一旦 public API 不够用，问题会立刻暴露
- 不会出现“demo 能做，外部接不进去”的假繁荣

### 2. 视觉回归测试最好保留稳定锚点

重构页面壳时，保留少量稳定的：

- class 名
- heading 文案
- aria-label

可以大幅降低测试迁移成本。

如果每次页面调整都把这些锚点全换掉，视觉测试会一直跟着震荡，很难形成长期基线。
