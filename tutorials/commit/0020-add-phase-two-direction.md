# 0020 把长期第二阶段计划补进 phase-one checklist

## 背景

`phase-one-checklist.md` 已经把第一阶段写得比较清楚了，但之前对第二阶段只有很轻的提示，比如性能目标和一些 deferred 项。它还没有明确回答一个更大的问题：

`chartx2` 在第一阶段之后，长期到底往哪里走？

用户这次又给了 TradingView 风格的参考图，所以这条长期方向不该继续只存在于对话里。

## 主要目标

把第二阶段作为同一条长期路线的下一段，正式写进 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md) 的底部。

## 改动概览

- 在 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md) 新增 `Phase-Two Direction`
- 明确只有一条长期路线：
  - 先对齐 `lightweight-charts` floor
  - 再走向 TradingView 风格 chart workspace
- 写清 phase two 的：
  - goal
  - entry condition
  - priorities
  - scope
  - success condition

## 关键知识

为什么把第二阶段写进第一阶段文档反而是对的？因为这个文档本来就承担“当前阶段和后续方向的边界定义”作用。

如果第一阶段文档完全不写第二阶段，那团队后面最容易发生的事就是：

- 当前实现只盯局部细节
- 长期目标只靠口头记忆
- 每次要不要往工作台方向走，都重新争一次

## 补充知识

- 好的阶段文档，不只告诉你“现在做什么”，也要告诉你“现在做的东西最终是为了接到哪里去”。
- 第二阶段计划写进去之后，第一阶段的每个底层实现就更容易判断：它是在铺路，还是在拐弯。

## 验证

- not run (docs-only change)

## 未覆盖项

- 这次只是把 phase two 的长期方向写清，不代表 phase two 已经开始实施
- 更细的 phase-two 执行 checklist 以后仍然需要单独展开
