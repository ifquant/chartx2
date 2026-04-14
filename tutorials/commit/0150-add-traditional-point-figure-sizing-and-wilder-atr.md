# 0150: 给 Point & Figure 补上 traditional sizing 和 Wilder ATR

本次提交继续收 `Point & Figure` 的 builder 语义，而不是再去调 demo 视觉参数。

这次解决的是两个具体问题：

1. `P&F` 之前虽然已经有 `auto / fixed / atr / percentage`，但还没有 `traditional` 这种更接近老派 OX 图软件的 box size 模式。
2. `ATR` 模式之前用的是简单平均 TR，不够接近真实交易软件里常见的 Wilder 风格平滑。

## 改了什么

- 在 `main-series-builders.ts` 里把 `ATR` box size 的估算改成了 Wilder-style smoothing。
- 新增 `inferTraditionalPointFigureBoxSize(...)`，按价格量级返回一档传统 box size。
- `buildPointFigureData(...)` 现在支持 `boxSizeMode: "traditional"`。
- `PointFigureStyleOptionsState` 和公共 options 面同步支持 `traditional`。
- workbench 里的 `P&F` 控制面新增 `Trad` 模式按钮。
- 右侧 `P&F` 指标文本会显示 `Traditional ... pts · ... rev`。

## 为什么这样做

如果只靠 `auto`，用户并不知道当前 box size 是怎么来的，也无法判断它是不是符合自己的使用习惯。

`traditional` 的意义是给 `P&F` 一个更稳定的默认落点：

- 小价格品种不会 box 过大
- 大价格品种不会 box 过小
- 模式语义比纯 `auto` 更容易解释

而 `ATR` 改成 Wilder smoothing，则是为了避免 box size 过度跟着短期噪声跳动。

## 这次验证

- `pnpm check` PASS
- `pnpm test:unit` PASS
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "point-figure"` PASS
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "point-figure"` PASS

## 还没做的

- 还没有严格对齐 TradingView 的 ATR / Percentage 公式细节。
- `traditional` 的档位表现在还是项目内规则，不是根据公开 upstream 行为反推的完整 parity map。
- `P&F` 后面仍然需要继续收 builder 本体，而不是只靠 sizing 模式补体验。
