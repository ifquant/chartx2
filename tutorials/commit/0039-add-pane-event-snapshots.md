# 0039: 给 chart-level pane events 带上完整 snapshot

这次提交继续完善上一轮的 chart-level pane event bus，不再只发“哪个 pane 变了”，而是把“变化后的整套 pane 状态”一起带出去。

## 为什么要继续做这一步

只发一个局部事件当然已经能用，但 host 层通常还要自己维护一份 pane 列表，然后把事件一点点 merge 回本地状态。这会有两个问题：

1. host 侧必须额外维护同步逻辑
2. 一旦 pane add/remove/resize 交织在一起，外部状态很容易漂

所以更稳的方式是：事件里同时带上变化目标 pane 和变化后的完整 pane snapshot，让 host 可以直接拿来更新自己的状态。

## 这次做了什么

1. 新增 `PhaseOnePaneState`
2. 把 `PhaseOnePaneEvent` 改成：
   - `pane`: 当前变化目标
   - `panes`: 当前完整 pane 列表快照
3. 对 `removed` 做了特殊处理：
   - `pane` 仍然表示刚刚被删除的那个 pane
   - `panes` 表示删除之后剩余的 pane 列表

## 给新人的两个提示

1. 事件总线里“局部 delta”和“完整 snapshot”各有用途。delta 省数据，snapshot 省状态同步复杂度。
2. `removed` 这种事件最容易写错，因为目标对象已经不在当前状态里了，通常要先保留一份删除前的状态再发事件。
