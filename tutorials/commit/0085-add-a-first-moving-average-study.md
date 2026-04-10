# 背景

上一版已经把 `requested-context + merge` 路径打通到了 `compare`，但还没有真正进入“指标 study”。

这会留下一个明显缺口：

- 系统能表达“另一上下文的数据如何 merge 回当前 chart”
- 但还不能表达“一个指标默认吃当前 chart context，也可以改成吃 requested-context”

这次就是把这条路先打通到一个最小指标：`Moving Average`

# 主要目标

给 phase-one public API 增加第一条真正的 indicator study：

- 默认对当前 `chart-context` 的 `close` 序列做 MA
- 允许切到 `requested-context`
- 仍然复用单一 chart 横轴，不引入第二条 time scale

# 改动概览

- 新增 [src/lib/chartx/internal/model/indicator-studies.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/indicator-studies.ts)
  - 定义 `buildMovingAverageStudyData()`
  - 先实现最小 `SMA` 版本
- 更新 [src/lib/chartx/internal/model/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/index.ts)
  - 导出 indicator study builder
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 新增 `PhaseOneMovingAverageStudyOptions`
  - 新增 `PhaseOneMovingAverageStudyApi`
  - 新增 `addMovingAverageStudy()`
  - 给 `StudySourceState` 增加最小 `indicator` 元数据
  - `resolveStudyDisplayData()` 现在能区分：
    - `chart-context` MA
    - `requested-context` MA
  - requested-context MA 会先 merge 回当前 chart bars，再做移动平均
- 更新 [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)
  - 导出 moving average study API 和 options 类型
- 更新 [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)
  - 增加 MA builder 单测
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 增加浏览器级 API 回归
  - 同时把测试命中点改成按 pane frame 精确计算，避免固定百分比 Y 带来的假失败

# 关键知识

这次最重要的不是“多了一个 MA 指标”，而是对象模型终于开始兑现：

- `Chart` 负责一条共享横轴
- `MainSeriesSource` 决定当前 chart bars 是什么
- `StudySource` 默认消费当前 `chart-context`
- 只有显式请求时，study 才会走 `requested-context + merge`

所以：

- `MA on Candles` 是对当前主图 bars 的 `close` 做平均
- `MA on Renko` 后面也应该默认对当前 Renko bars 做平均
- 如果用户想看“标准时间上下文的 MA”，那应该走 requested-context，而不是给副图再造一条横轴

# 补充知识

有两个实现细节值得记住：

- `indicator` 和 `compare` 虽然都属于 study，但它们不是同一种语义
  - `compare` 更像“另一条展示序列”
  - `indicator` 更像“对输入序列做计算后得到的新序列”
- 浏览器交互测试里，涉及多 pane 命中时，尽量不要写死 `0.92` 这种相对坐标
  - pane 数量一变，命中的就可能不是原来的 pane
  - 这次改成按 layout 常量和 pane 高度推导目标 Y，稳定性会高很多

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这次只实现了最小 `SMA` study，还没有做 `EMA`、`MACD`、`RSI`
- `requested-context` 的 `gaps` 仍然没有真正落成 whitespace/gap 渲染
- indicator 的参数面目前很窄，还没有更完整的 indicator input/style schema
