# 0015 真正写清 phase-one parity definition

## 背景

到这一刀之前，[docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md) 里最关键但也最空的一块，一直是 `Parity Definition Checklist`。大家都在说“phase one 要做到 lightweight-charts parity floor”，但如果这句话不被写成 pass/fail 标准，它就还是一句会不断漂移的口号。

所以这一步不写代码，专门把那个定义补实。

## 主要目标

把 `phase-one parity` 从抽象方向，收成当前仓库可以拿来对照的具体标准。

## 改动概览

- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)，把以下内容写成明确的 pass/fail 定义：
  - chart primitives
  - time scale behavior
  - price scale behavior
  - data model and update semantics
  - supported series types
  - pane model
  - render pipeline assumptions
  - baseline public API surface
  - baseline interaction support
  - test expectations
  - performance floor
  - explicit deferrals
- 把 parity checklist 的 section 勾到已定义状态，而不是继续留空
- 更新 [src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts)，让页面里的阶段摘要反映 `Parity Definition` 已经完成

## 关键知识

为什么这一步值得单独成一个提交？因为对这种 engine-first 项目来说，范围不是靠“我们心里知道”来控制的，而是靠文档里的拒绝列表来控制的。

一旦你不把“不做什么”写出来，项目就会默认对所有人承诺更多。

## 补充知识

- 好的 parity definition 不是“列出很多功能名”，而是每一项都能回答两个问题：什么算通过，什么明确不算。
- 对 early-stage chart engine 来说，deferral list 和 feature list 一样重要。因为后者决定 ambition，前者决定执行不会失控。

## 验证

- not run (docs-only change)

## 未覆盖项

- parity definition 已写清，但对应实现本身并没有因为这次提交自动变完整
- 这份定义仍然是 phase-one 范围，不等于完整 `lightweight-charts` 或更高层 TradingView 工作台目标
