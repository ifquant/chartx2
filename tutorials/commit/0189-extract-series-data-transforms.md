# 0189 - 抽出 Series Data Transforms

## 背景

`chart-harness` 底部还保留了一组纯数据转换函数：

- line data 转 canonical OHLC
- histogram/volume data 转 canonical OHLC
- canonical data update
- main-series builder 应用
- histogram visual direction/color 推导

这些函数没有 canvas、pane、drawing 或 public API 依赖。继续放在 harness 里会让 harness 看起来还在拥有 series 数据策略。

## 改动

- 新增 `chart-series-data-transforms.ts`，集中放置 series 数据转换 helper。
- `chart-harness` 改为从新模块导入这些 helper 和 `HistogramVisual` 类型。
- 删除 harness 底部对应的本地函数和本地 `HistogramVisual` 类型。
- 增加 `chart-series-data-transforms.test.ts`，覆盖 line/histogram normalization、canonical update、main builder 应用和 histogram visual 推导。
- 架构文档补充 series data transforms 应继续离开 harness 的方向。

## 为什么没有行为变化

这次是移动纯函数，不改变调用点传入的参数，也不改变函数内部规则：

- line 仍然把 `value` 同时写入 open/high/low/close。
- histogram-like data 仍然以 0 为 baseline。
- canonical update 仍然通过 `SeriesDataStore` 复用有序更新规则。
- main-series builder 仍然调用 `applyMainSeriesBuilder`。
- histogram visual 的 `isUp` 仍然优先使用显式 `up`，否则和前一根 value 比较。

## 这一刀的价值

### 1. source owner deps 更像 wiring

`chart-harness` 现在只是把 transforms 传给 source owner / series API factory，不再自己定义转换算法。

### 2. 数据规则有独立测试

后续继续收 source owner 或 primary/secondary mutation 时，可以直接复用这些测试，不需要靠 harness 集成路径覆盖纯数据规则。

### 3. harness 底部 helper 继续变薄

这类底部纯函数最适合先搬走，因为风险低、边界清楚，并且不会干扰 render 或 drawing interaction。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-series-data-transforms chart-source-owner chart-primary-series-factory chart-secondary-series-api`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-series-data-transforms.ts tests/unit/chart-series-data-transforms.test.ts docs/chart-workstation-architecture.md tutorials/commit/0189-extract-series-data-transforms.md`

## 还没做

- 没有改 source owner 的依赖形状。
- 没有改 primary/secondary series API 行为。
- 没有移动 renderer selection 或 chart-type mapping helper。
