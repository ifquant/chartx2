# 0136: 在 chart snapshot/template restore 前先校验 drawings

上一刀我们已经把 drawing runtime 校验收成了共享 validator registry。  
但 snapshot/template 这条线还有一个剩余问题：

- restore 最终虽然也会走 `addHorizontalLineDrawing(...)` / `addTrendLineDrawing(...)`
- 但它是在清空当前 chart 之后才开始逐个重建

这意味着如果 snapshot 里混进了坏 drawing，当前图有可能会先被清掉一半，再在 restore 中途抛错。

这类失败方式不够稳。

## 这次做了什么

### 1. 给 `applyChartStateSnapshot(...)` 加了 drawing 前置校验

现在在真正开始：

- `clearRestorableChartDrawings()`
- `clearRestorableChartStudies()`
- `clearRestorableChartSeries()`

之前，会先调用：

- `assertChartDrawingSnapshotsValid(state.drawings, state.panes.length)`

这一步只做最小必要的事：

- 校验 `paneIndex` 是否落在 snapshot 自己描述的 pane 范围内
- 把每条 drawing 映射成 validator registry 能理解的 target
- 调用 `assertDrawingTargetValid(...)`

也就是说：

- 先判定 snapshot 里的 drawings 能不能恢复
- 能恢复，才开始真的改当前 chart

## 2. restore 路径第一次具备“失败前不破坏现状”的性质

这不是完整事务系统，但已经比之前稳很多：

- 以前：先清空，再重建，坏 drawing 可能在中途炸掉
- 现在：先校验 drawings，失败就直接拒绝，不进入清空/重建

对当前 drawing 范围来说，这已经把最明显的 restore 后门堵住了。

## 3. 补了一条 API 契约

新增浏览器测试会构造一个：

- 当前 chart 上先有一条合法 `horizontal-line`
- 再调用 `applyChartState(...)`
- 传入一份包含非法 `trend-line` 的 drawing snapshot

预期行为是：

- `applyChartState(...)` 抛出 runtime 错误
- 当前 chart 上原来的 drawing 保持不变

这条测试的价值在于，它验证的不只是“会报错”，而是：

- “报错前不能先把当前图破坏掉”

## 为什么这一步值钱

因为这次补的不是新功能，而是 restore correctness。

如果未来继续做：

- 外部导入 template
- workspace persistence
- drawing template
- 更多 drawing 类型

那么“坏数据先被拒绝，当前图保持不动”会是一个很基础的产品属性。

## 这次没做什么

- 还没有把整个 `applyChartStateSnapshot(...)` 做成真正的事务回滚系统
- series/studies restore 还没有同等级的前置 validator
- 也还没有结构化错误对象，仍然是直接抛 message

所以这一步是：

- 先把 drawings restore 从“可能中途破坏现状”推进到“先校验再动手”

而不是把整个 chart restore 都做成原子事务。
