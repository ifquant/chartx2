# 0277: 记录 TradingView 三层对齐计划

这次没有继续拆 runtime，也没有新增产品 UI。目标是把已经讨论清楚的长期方向写进仓库，让后续实现不再依赖聊天上下文。

`chartx2` 当前已经不是 starter shell，但也还不是完整 TradingView-like workstation。之前的文档分别记录了 phase-one、post-harness、workstation architecture 等局部路线；缺口是没有一个总路线图回答：

- 什么算 engine floor
- 什么算 workstation product surface
- 什么应该延后到 platform layer
- 哪些工作可以并发，哪些必须串行集成

所以这次新增的是长期计划文档，而不是执行代码。

## 1. 这次新增了什么

新增：

- `docs/tradingview-alignment-plan.md`

这份文档把 TradingView 对齐拆成三层：

1. `Foundation Parity`
2. `Workstation Parity`
3. `Platform Parity`

拆成三层的原因是：这三个层次的风险完全不同。

`Foundation Parity` 关心的是 chart engine 本身，比如 runtime container、pane/price-scale ownership、series/chart-type registry、drawing、study、state migration、performance gate。

`Workstation Parity` 关心的是分析师日常使用的工作台，比如 watchlist、symbol open、saved layout、indicator catalog、alerts、object tree、multi-chart layout、bar replay、screener。

`Platform Parity` 关心的是更重的平台能力，比如 script runtime、strategy tester、paper trading、broker adapter、cloud sync、publishing/marketplace。

如果把这三层混在一起，后续很容易在 engine 还没稳定时就开始做 Pine-like script 或 broker integration，最后把平台级复杂度倒灌进 chart runtime。

## 2. 这次为什么要改 README 和架构文档

只新增一个深层 docs 文件还不够。后续 agent 通常会先读：

- `README.md`
- `docs/chart-workstation-architecture.md`
- `docs/post-harness-next-lines.md`

所以这次也给这些入口补了链接：

- `README.md` 指向三层长期路线图
- `docs/chart-workstation-architecture.md` 说明完整路线图单独放在 alignment plan
- `docs/post-harness-next-lines.md` 继续保留为较窄的 post-harness 执行指南

这样短期和长期不会互相覆盖：

- `post-harness-next-lines` 回答“下一批架构收口怎么做”
- `tradingview-alignment-plan` 回答“完整 TradingView-like 目标怎么分层推进”

## 3. 这份计划的使用方式

后续推进时，可以按这个顺序切片：

1. 先收 `Foundation closeout`
2. 再做 `Workstation v0`
3. 最后再碰 `Platform v0`

其中最重要的约束是：

- `chart-harness` 和 `src/routes/+page.svelte` 这类高重叠入口必须串行集成
- 新 owner/model/test/doc 这类 disjoint write set 可以并发
- public API、layout snapshot schema、state migration 不能多线同时改
- Pine-like scripting、真实 broker、cloud sync 不能提前进入下一阶段主线

这能减少“看起来在加功能，实际把边界重新搅乱”的风险。

## 4. 这次没有做什么

没有实现任何新 feature。原因是这次的目标是把全局计划落盘，避免下一步实现方向继续漂移。

没有更新 visual specs。因为 docs-only 改动不会影响运行时画面。

没有把计划伪装成完成状态。文档明确写了当前只是在 chart engine foundation 上有明显进展，workstation 仍然早期，platform 还没开始。

## 验证

- `pnpm check`

## 未包含

- 没有改动 chart runtime 代码
- 没有新增 workstation UI
- 没有实现 script、strategy tester、broker、cloud sync 等 platform 能力
