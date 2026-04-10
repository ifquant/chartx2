# 背景

前两步已经把：

- `ChartBarSequence`
- `ChartContext`

放进了引擎模型里，但 study 这一侧还缺一个很重要的语义：

“当前这个指标/副图，到底是吃当前 chart context，还是吃另一个请求来的 context？”

如果不把这件事显式写进 runtime state，后面做：

- `MACD on Renko`
- `standard-context MACD on Renko`
- `higher timeframe indicator`

就会再次回到“逻辑存在脑子里，但代码里没有模型”的状态。

# 主要目标

先把 `StudySource` 的输入上下文显式建出来，并把默认路径固定为 `chart-context`。

# 改动概览

- 更新 [src/lib/chartx/internal/model/chart-context.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/chart-context.ts)
  - 给 `ChartContext` 增加 chart-level descriptor 元数据：
    - `symbol`
    - `resolution`
    - `session`
    - `timezone`
  - 增加 `updateDescriptor()`，让这些元数据可以在不清空主图状态的情况下独立更新
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 给 `StudySourceState` 增加 `inputContext`
  - 当前默认值为 `{ mode: "chart-context" }`
  - 给 `PhaseOnePaneSeriesState` 增加 `inputContextMode`
  - pane snapshot / pane event bus 现在会把 study 的输入上下文模式带出来
- 更新 [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)
  - 增加 `ChartContext` descriptor 生命周期单测
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 把 pane event / overlay+compare 断言扩展到 `inputContextMode`

# 关键知识

“默认行为”也应该有模型。

现在我们知道：

- main chart 可以是 `Renko`
- studies 默认应该吃当前 `chart-context`

如果这件事只写在文档里，而不进入 `StudySourceState`，那等到你真的实现 `requested-context` 时，就没有稳定的扩展点。

# 补充知识

给 snapshot 增加元数据字段，看起来像“小事”，但它其实是在锁定对象模型。

因为一旦 pane event 里已经有：

- `studyKind`
- `inputContextMode`

后面再做 `requested-context`，你就不是在发明一个新世界，而是在扩展已经公开存在的 source metadata。

另一个经验是：像 `symbol / resolution / session / timezone` 这种字段，哪怕暂时还没接 UI 和 datafeed，也应该尽早进 `ChartContext`。越晚补，越容易在别的模块里长出重复版本。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这次只把 `inputContext` 变成显式状态，还没有真正实现 `requested-context`
- `mergePolicy = carry-forward | gaps | exact` 也还没有落进 runtime 行为
