# 背景

前面已经把不少 `time-bars` 家族的主图类型补进来了，但如果要继续往 TradingView 的主图 breadth 靠近，`volume-candles` 是一类很特殊的图型：

- 它看起来还是蜡烛
- 但实体宽度不再固定
- 宽度要跟成交量语义绑定

这意味着它不能像 `stepline` 或 `hollow-candles` 那样只改几何模式名；如果主序列输入里根本没有 `volume`，那做出来的就只是“伪 volume-candles”。

# 主要目标

让 `chartx2` 的主序列数据模型首次支持可选 `volume` 字段，并用它驱动一版最小可用的 `volume-candles` 主图：

- 主图类型切换到 `volume-candles`
- 柱体高度仍由 OHLC 决定
- 柱体宽度按 bar volume 归一化缩放

# 改动概览

- 更新 [src/lib/chartx/internal/model/series-data.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/series-data.ts)
  - `OhlcDataPoint` 新增可选 `volume`
  - 现有 plot row / scale 逻辑仍保持只吃 OHLC，不强行把 volume 混进价格域
- 更新 [src/lib/chartx/internal/renderers/candlesticks-renderer.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/renderers/candlesticks-renderer.ts)
  - `CandlestickItem` 新增可选 `bodyWidth`
  - renderer 不再只依赖统一 `barWidth`，而是允许单个 candle 使用不同宽度
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneMainChartType` 新增 `volume-candles`
  - 主图类型映射新增 `volumeCandleStyle`
  - 新增 `buildVolumeWidthScale()`
  - 渲染 `volume-candles` 时，会把 `inputData.volume` 映射成每根 candle 的 body width
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - demo bar 数据现在自带 `volume`
  - workbench 主图按钮新增 `Vol Candles`
  - 主图可以直接切到 `volume-candles`
  - volume pane 也改为优先复用 bar 自带 volume，而不是每次重新推导一套独立数值
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 增加 `volume-candles` 主图切换回归
  - 锁住：
    - `chartType`
    - `renderer`
    - `styleSchemaId`
    - 首帧视觉快照
- 新增快照：
  - [phase-one-api-volume-candles-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-volume-candles-series.png)

# 关键知识

这次最值得记住的一点是：

`volume-candles` 不是单纯 renderer 花样，它第一次逼着主图输入模型承认“OHLC 之外还有别的主图语义字段”。

但这并不意味着你要立刻把整套模型改成：

- volume 进入 price scale
- volume 进入 plot row value
- volume 跟价格一起参与 autoscale

正确做法是：

- price 仍然只进价格域
- volume 作为附加语义留在源数据上
- renderer 需要时再单独消费它

这样才能避免把“价格尺度”和“实体表达参数”混成一锅。

# 补充知识

这次 `volume-candles` 的宽度缩放还是最小实现：

- 先在当前序列内部做 min-max 归一化
- 把 volume 映射到一个受限宽度区间

这足够做一版视觉上真实的主图类型，但还不是最终答案。后面如果要更像 TradingView，还会碰到：

- 更合理的宽度比例公式
- 不同缩放级别下的实体最小/最大宽度策略
- volume 缺失 bar 的回退策略
- synthetic chart type 下如何定义 volume-candles 语义

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- `volume-candles` 目前只支持最小宽度归一化策略，还没有更完整的 public style/options surface
- 这次没有把 volume 引入 study 输入层，指标默认仍主要消费 OHLC 价格字段
- `line-break / kagi / point-figure / range` 这些 builder 级 chart type 仍然是后续工作
