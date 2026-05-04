## 背景

`chartx2` 之前已经把 `TradingTicketPanel`、`StrategyTesterPanel` 这些 host-facing public shells 暴露给 `alpha2`。但它们还有一个真实缺口：宿主虽然能渲染这些组件，却没法把按钮动作真正接回自己的 runtime。

最明显的两个问题是：

- `TradingTicketPanel` 的 submit 按钮没有宿主回调；
- `StrategyTesterPanel` 的 action shell 只会在组件内部显示 banner，宿主拿不到 action 和参数 draft。

这意味着 `alpha2` 只能把它们当展示壳用，没法把它们推进成真实的宿主动作入口。这个提交就是把这条 seam 补上。

## 主要目标

- 给 `TradingTicketPanel` 增加宿主 submit callback。
- 给 `StrategyTesterPanel` 增加宿主 action callback，并把参数 draft/context 一起暴露出来。
- 同步修正文档中关于 `TradingTicketPanel` callback 缺口的过时描述。

## 改动概览

- 在 `src/lib/demo/components/TradingTicketPanel.svelte` 中新增：
  - `onSubmit: (model) => void | Promise<void>`
- submit 按钮现在会调用 `onSubmit(model)`。
- 在 `src/lib/demo/components/StrategyTesterPanel.svelte` 中新增：
  - `onRunAction(action, context) => void | Promise<void>`
- `runActionShell(...)` 在通过本地 gating 之后，会把：
  - `activeRunOptionId`
  - `activeFilterId`
  - `selectedTradeId`
  - `parameterDraft`
  - `parameterDraftDirty`
  一起发回宿主。
- 更新 `docs/alpha2-host-surface-readiness.md`，把 `TradingTicketPanel` 的“没有 submit callback seam”改成更准确的当前状态。

## 关键知识

### 1. 为什么这里只加 callback seam，不加新的公共 runtime 类型

当前问题的核心不是 runtime 类型系统不够复杂，而是宿主根本接不到动作。先把 callback seam 打通，`alpha2` 就能开始验证真实宿主动作该怎么编排。只有当多个宿主都证明这条 seam 还不够时，才值得继续升成更重的公共 action protocol。

### 2. `StrategyTesterPanel` 为什么要把 parameter draft 一起给宿主

因为 action shell 的关键价值就在“针对当前 draft 做 rerun / compare / save variant”。如果宿主只能拿到 `action.id`，那它依然不知道用户当前到底改了什么参数，最终还是只能停留在假动作。

## 补充知识

### 1. host-facing shell 和 host-owned runtime 要分开

`chartx2` 负责把 UI shell 和回调 seam 做清楚，但不应该把 `alpha2` 的业务 runtime、broker policy 或 strategy execution policy塞回 `chartx2`。这也是为什么这次只加 callback，不直接加假 backend。

### 2. 文档里的 readiness 结论需要跟代码一起收敛

像 `alpha2-host-surface-readiness.md` 这种文档，如果不跟代码同步修，会直接误导后续宿主接入方以为 seam 还不存在。这里顺手修掉过时描述，比放着以后再清理更靠谱。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 这次只增加 callback seam，没有定义更重的公共 action/result protocol。
- `chartx2` 仍然不拥有宿主的 trading submit runtime 或 strategy execution runtime。
