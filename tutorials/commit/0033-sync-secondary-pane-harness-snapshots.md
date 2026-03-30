# 0033: 同步 secondary pane 改动后的 harness 基线图

本次提交没有继续修改图表逻辑，只是把上一轮 `secondary pane` 泛化后已经变化的浏览器基线图正式收进仓库。

## 为什么要补这一步

上一轮把 `secondary pane` 从 `volume only` 扩成了 `line / bar / histogram / volume` 都可挂载。虽然那次 public API 的视觉回归已经更新，但浏览器 harness 的几张基础快照也跟着发生了变化。如果这些图片不提交，之后重新跑 `pnpm test:visual` 时就会把“预期中的画面变化”误报成失败。

## 这次提交做了什么

1. 把 `phase-one-harness` 相关的六张基线图同步到当前渲染结果。
2. 不改 TypeScript 逻辑，只收口视觉回归工件。
3. 让仓库里的 snapshot 状态与当前 `chart-harness` 行为重新一致。

## 给新人的两个提示

1. Playwright 的 snapshot 测试里，图片本身就是断言的一部分。代码改了但图片没同步，测试一样会失败。
2. 如果一次改动影响了布局、坐标轴、pane 分配或默认数据，常常会同时改动多张快照，而不只是你新增的那一张。
