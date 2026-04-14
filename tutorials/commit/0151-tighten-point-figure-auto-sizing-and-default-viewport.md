# 0151: 收紧 Point & Figure 的 auto sizing 和默认视口

这次不是继续调 workbench 文案，而是直接收 `Point & Figure` 的三个根问题：

1. `auto box size` 太保守，常把默认列数算得太少。
2. `X/O` 字形跟着列宽和 box 高度放大后，容易互相压住。
3. 默认 `P&F` 视口对“列很少”和“列很多”没有分开处理，所以图容易显得不是过密就是过空。

## 改了什么

- `inferPointFigureBoxSize(...)` 改成候选集 + 打分选择，不再取几个候选值的中位数。
- 新增按目标列数和目标 box 数打分的逻辑，让 `auto` 默认先落到一个可读范围。
- 把 `buildPointFigureData(...)` 的内部构造拆成 `buildPointFigureBoxes(...)`，让 auto sizing 可以直接基于真实 builder 产物评估列数。
- `PointFigureRenderer` 缩小了 `X/O` 字形尺寸和线宽，避免少量列时过度放大。
- workbench 的 `P&F` 默认 bar spacing 和 visible range 改成：
  - 列数不多时完整看全
  - 列数较多时只看最后一段，但不会只剩几列贴在右边

## 为什么这样做

`P&F` 和普通 K 线不同，默认可用性很大程度取决于：

- 你一开始给它多大的 box size
- 生成了多少列
- 初始视口到底展示多少列

如果只改其中一层，视觉还是会很奇怪：

- 只改 builder，不改 glyph，`X/O` 还是会挤在一起。
- 只改 renderer，不改 auto sizing，列数还是太少。
- 只改 viewport，不改 builder，还是会出现“图看着像只有几根”的问题。

所以这次是一起收口，而不是继续单点调参。

## 这次验证

- `pnpm check` PASS
- `pnpm test:unit` PASS
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "point-figure" --update-snapshots` PASS
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "point-figure" --update-snapshots` PASS

## 还没做的

- 还没有把 `P&F` builder 做成更严格的 TradingView parity 公式。
- `auto sizing` 现在已经是基于真实列数打分，但还没有接入更完整的 viewport-aware policy。
- workbench 右侧还没有把 `visible columns / effective box size / mode` 变成更强的分析面板。
