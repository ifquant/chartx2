## 本次提交做了什么

这次把 `Point & Figure` 的 box-size 从“只有 fixed / auto”推进成了 4 种模式：

- `auto`
- `fixed`
- `atr`
- `percentage`

同时把 workbench 上的 `P&F` 卡片、按钮和滑杆接成真实可用的调节面，让 `P&F` 和其他主图继续共享同一份原始 K 线数据，而不是再造一份专有样例。

## 为什么要这样改

前一轮虽然把 `P&F` 拉回到了“能看见”的状态，但还有两个明显问题：

1. `auto` 的 box-size 只是 phase-one 版本，不够接近 TradingView 常见的参数面。
2. 用户没有办法在同一套原始数据上切 `ATR / Percentage` 看差异，也没法通过滑杆微调 `auto` / `atr` 模式。

如果不把这几个模式先打通，后面再谈更严格的 TradingView 对齐就会一直停留在“只能改固定值”的阶段。

## 关键实现

### 1. 给 `P&F` 补完整 box-size 模式

在 `main-series-style-options.ts` 里把 `PointFigureStyleOptionsState` 扩成：

- `boxSizeMode`
- `boxSizeScale`
- `reversalBoxes`
- `atrLength`
- `percentageValue`

这样 `P&F` 的参数面才真正成了一个独立 style schema，而不是硬塞在通用主图 options 里。

### 2. 在 builder 层支持 `ATR / Percentage`

在 `main-series-builders.ts` 里新增了：

- `inferAverageTrueRange(...)`
- `inferPercentageBoxSize(...)`

`buildPointFigureData(...)` 会根据 `boxSizeMode` 决定最终用哪一套 box-size 推导，并且 `auto / atr / percentage` 都支持再乘上 `boxSizeScale`。

这一层很重要，因为真正决定 `P&F` 是否可读的，不是 UI 按钮，而是 builder 产出的列密度和 box-size。

### 3. 让 workbench 的 `P&F` 控件接到真实运行时

在 `chartx-demo.ts` 和 `+page.svelte` 里补了：

- `P&F Auto / ATR / % / Fixed` 模式切换
- `Scale` 滑杆
- `ATR length` 滑杆
- `Percent` 滑杆
- 右侧 `P&F` 指标卡片

并且这些控件都直接调用 chart 的真实 `pointFigure*` options，不是单纯改文案。

### 4. 修正 `P&F` 的默认可读性

这次顺手收了两个直接影响观感的点：

- `auto box-size` 推导改得更敏感，避免 box-size 过大导致只剩几列
- `X/O renderer` 的字形尺寸改成同时受列宽和 box 高约束，避免列一宽就互相重叠

这两点不改的话，即使模式切换接通了，workbench 里仍然会出现“看起来像没有数据”或者 “X/O 压在一起”的假象。

## 验证

- `pnpm check`：通过
- `pnpm test:unit`：通过
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "point-figure" --update-snapshots`：通过
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "point-figure" --update-snapshots`：通过

## 这次顺手学到的点

### 1. `P&F` 的可读性通常先死在“box-size 太大”，不是先死在 renderer

如果 builder 只产出 5 到 8 列，再漂亮的 `X/O renderer` 也救不回来。先保证列数和 reversal 密度合理，再谈字形和视觉细节。

### 2. 浏览器测试里的“值没变”经常是 locator 选错了

这次有一条 harness 测试一开始拿到的是 `Mode: auto`，不是 `Box size`。看起来像滑杆没生效，实际是断言目标错了。对于带 inspector/card 的 UI，最好直接沿 `label -> field value` 这条局部 DOM 关系去取值。
