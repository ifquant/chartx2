# 0174 - 从 Chart Harness 抽出 State Coordinator

## 背景

上一刀已经把 render 主链从 `chart-harness` 抽成了 `render coordinator`。但如果 state/template/restore 这条线还继续卡在 harness 里，`chart-harness` 仍然不是一个薄的 adapter，而只是从“自己渲染一切”变成“自己恢复一切”。

当时 harness 里还同时握着这几类逻辑：

- `getChartState()`
- `applyChartState()` / `applyChartStateSnapshot()`
- `getChartTemplate()` / `applyChartTemplate()`
- restore-time 的 clear / rebuild / scale-apply / finalize glue

这些逻辑的问题不在于单个 helper 长不长，而在于它们共同构成了一条完整的 state orchestration 链。只要这条链还在 harness 本体里，snapshot/template 就仍然是 harness-local policy。

## 改动

- 新增 `src/lib/chartx/internal/views/chart-state-coordinator.ts`。
- 把 chart state 的组合层收进这个 coordinator：
  - chart snapshot 组装
  - chart template 创建与 normalize-apply
  - restore-time 的 clearing
  - series / study / drawing rebuild glue
  - pane reconcile、time-scale / price-scale restore
  - restore finalize render
- `chart-harness.ts` 现在对这条线只做 coordinator 装配和方法委托，不再自己内联整条 state/template/restore orchestration。
- 补了 `tests/unit/chart-state-coordinator.test.ts`，锁住：
  - snapshot 读取会统一经过 coordinator
  - restore 会串起 clear / pane reconcile / content rebuild / scale apply / finalize
  - template input 会先 normalize，再落到 chart state apply

## 这一刀真正解决了什么

### 1. state/template/restore 不再是 harness-local 总控流程

之前虽然 restore 下面已经有很多 leaf module，例如：

- `chart-state-runtime`
- `chart-state-content-runtime`
- `chart-state-restore-content`
- `chart-state-apply-runtime`

但真正把这些阶段拼起来的人还是 `chart-harness`。这意味着 leaf helpers 已经拆了，ownership 却还没拆。

这次把 orchestration 本身也挪进 `chart-state-coordinator`，才算真正把这条线从 harness 身上拿下来。

### 2. template 和 snapshot 终于走同一条组合层

如果 `getChartState()`、`getChartTemplate()`、`applyChartTemplate()` 分散在 harness 里各自做一点 glue，后面很容易继续漂移：

- snapshot 读路径改了
- template apply 路径没同步
- restore 的 clearing / finalize 顺序被局部改坏

现在它们统一从一个 coordinator 出口走，后面调整 restore policy 时，影响面和测试面都更清楚。

### 3. 这一步让 harness 更接近 adapter-shell

经过 source owner、pane owner、drawing owner、render coordinator、state coordinator 这些切分之后，`chart-harness` 剩下的角色更像：

- composition root
- lifecycle / invalidation adapter
- public API handoff

这才是我们一直在做的“收 harness”的真实目标：不是把一个大文件拆成很多小文件，而是把运行时 policy ownership 从 harness 身上剥掉。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-state-coordinator chart-state chart-state-runtime chart-state-content-runtime chart-state-restore-content`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- `chart-harness` 还没有到“只剩极薄 adapter shell”的终态，仍然留着一部分 lifecycle / public glue。
- state coordinator 现在已经接管了 state/template/restore 的组合层，但还没有把更高层的 invalidation policy 一并带走。
- 后面仍然需要继续看 harness 里剩余的 adapter-shell bookkeeping，确认哪些还值得再下沉，哪些应该保留在 composition root。
