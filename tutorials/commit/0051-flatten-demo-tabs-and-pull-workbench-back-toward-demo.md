# 0051: 把 demo shell 改成并列 chart tabs，并把 Workbench 拉回完整工作台

这次不是新增图表能力，而是纠正 demo shell 的组织方式。

上一版虽然把 `chartx2` 从“单一首页”变成了 demo program，但中间多了一层：

- `Workbench`
- `Features`
  - `Series`
  - `Panes`
  - `Interactions`
  - ...

这在工程上是清楚的，但在产品感上是错位的。因为对 `chartx2` 来说：

- `Series`
- `Panes`
- `Interactions`
- `Scales`
- `Data`
- `Styling`
- `Events`

这些本来就应该和 `Workbench` 一样，都是对 K 线图表能力的直接展示。

## 这次改了什么

### 1. 去掉 `Features` 这层中间页

现在根页一级 tabs 直接变成：

- `Workbench`
- `Series`
- `Panes`
- `Interactions`
- `Scales`
- `Annotations`
- `Data`
- `Styling`
- `Events`

也就是说，特性例子不再藏在二级页里，而是和 `Workbench` 并列。

这样更符合 `chartx2` 的角色：

- `Workbench` 是完整例子
- 其它 tabs 是特性例子

### 2. 把 `Workbench` 再往 `demo.jpg` 拉回去

这次重点不是继续做一个“context panel 很清楚”的展示页，而是让 `Workbench` 更接近完整 chart terminal。

现在它重新有了几块更像 TradingView 工作台的结构：

- 左侧工具栏
- 顶部更像图表工具条的按钮组
- 中间主图工作区
- 右侧更像 watchlist / symbol detail / notes 的面板
- 底部周期 strip 和操作按钮

虽然还不是最终产品，但至少方向感回来了。

### 3. 测试跟着导航模型一起扁平化

视觉测试不再走：

- 点 `Features`
- 再点 `Series` / `Panes`

而是直接点并列 tabs。

这让回归测试和实际产品结构一致，不会再出现“界面已经扁平化了，测试还停留在旧导航模型”的错位。

## 为什么这次修正重要

因为 `chartx2` 不是一个文档站，也不是一个多层 demo 索引页。

它更像一个图表实验室：

- 一个完整主例子
- 一组直接可切换的 chart capability demos

把这些 tab 提升到同一层之后，用户会更容易建立直觉：

- Workbench 看整体
- Series 看图形种类
- Panes 看 pane 架构
- Interactions 看交互闭环
- Data / Styling / Events 看公共接口能力

## 验证

实际跑过：

- `pnpm check`
- `pnpm test:visual --update-snapshots`

完整回归会在提交前继续跑：

- `pnpm test`
- `pnpm build`

## 给新人的 2 个补充知识点

### 1. 信息架构错误，UI 越做越“对”也会让产品更难用

有时候页面并不是“不够漂亮”，而是层级错了。

如果一个东西本来应该是一级入口，却被你包进二级页，用户会天然觉得它没那么重要，切换成本也会上升。

### 2. 样例程序的导航结构，本身就是产品表达

demo 不是中立容器。

你把能力怎么分组、放在哪一级、默认打开什么，都会直接影响别人怎么理解这个项目。

对 `chartx2` 这种图表系统来说，这个表达尤其重要，因为“能不能一眼看出它支持哪些图表能力”，本身就是样例程序的价值。
