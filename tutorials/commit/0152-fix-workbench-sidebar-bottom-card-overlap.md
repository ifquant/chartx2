# 0152: 修正 workbench 右侧栏底部卡片互相挤压

这次修的是一个纯布局问题，不是图表引擎问题。

## 现象

当右侧栏内容变多时，底部的：

- `Drawing`
- `Panes`
- `Activity`

会在右下角看起来挤进同一块区域，像是文字叠在一起。

## 根因

右侧栏之前是一个固定高度 grid，但底部几张卡片仍然在同一个普通文档流里排布：

- 上面的卡片吃掉高度
- 底部卡片继续往下排
- 只有 `Activity` 自己设置了 `overflow: auto`

结果不是“整个底部区域滚动”，而是“卡片各自抢高度”，视觉上就像互相压住了。

## 这次改法

- 把 `Drawing / Panes / Activity` 包进一个单独的 `.workbench-sidebar-scroll`
- 让右侧栏变成：
  - 顶部几张摘要卡固定
  - 底部详情卡放进一个独立滚动区
- 去掉 `event-log` 自己那层多余滚动，让滚动边界只存在一层

这样内容多的时候，用户会滚动右侧详情区，而不是看到几张卡片互相压在一起。

## 验证

- `pnpm check` PASS
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench opens by default and renders the baseline chart|point-figure opens with a readable auto box size" --update-snapshots` PASS

## 还没做的

- 右侧栏还没有更细的 sticky section header。
- `Drawing / Panes / Activity` 还没有被拆成可折叠区块。
