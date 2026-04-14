## 本次提交做了什么

这次没有再碰 `P&F` 的演示数据和按钮文案，而是直接收 `Point & Figure builder` 本体：

- 从只看 `close`，改成真正利用每根原始 K 线的 `high / low`
- 用更明确的 `reversal` 规则决定何时换列
- 在 workbench 里，当默认生成列数不多时，把整组列完整放进初始视口，而不是继续硬贴右边

目标很明确：先让 `P&F` 的结构更像真正的 OX 图，再谈更细的 TradingView 对齐。

## 为什么前一版还是不对

前一版虽然已经有：

- `auto / atr / percentage / fixed`
- 更小的 `X/O renderer`
- 更合理的 `pointCount`

但你继续看到两个明显问题：

1. `X/O` 还是会压得很近，看起来像结构不对。
2. 数据列数偏少，默认都堆在右边，像“没有数据”。

根因并不在 demo，而在 builder 还停留在一个过于粗糙的 phase-one 规则：

- 只看 `close`
- 忽略 intrabar 的 `high / low`
- 初始列和 reversal 都是“close 够不够远”的近似

这在 `P&F` 上是不够的。

## 关键实现

### 1. `P&F builder` 改成利用 `high / low`

以前 `buildPointFigureData(...)` 主要看 `input.close`：

- 初始列方向看 `close - anchor`
- 上涨列继续扩展看 `close >= columnHigh + box`
- 下跌列继续扩展看 `close <= columnLow - box`
- reversal 也看 `close`

这会漏掉很多真实应该出 box 的 intrabar 波动。

现在改成：

- 初始列先比较 `high` 和 `low` 两边各自能推进多少个 box
- 上涨列扩展看 `high`
- 下跌列扩展看 `low`
- reversal 也分别用 `low` / `high`

这样列的构造终于开始接近真正的 P&F 语义：  
不是“收盘价离 anchor 有多远”，而是“这根 bar 的极值到底触发了多少个 box / reversal”。

### 2. 初始列方向不再靠单一 close 猜

以前第一列常常因为 `close` 接近 anchor 而延迟生成，或者方向不稳定。

现在在 `columnDirection === null` 时：

- 先算 `upBoxes`
- 再算 `downBoxes`
- 取推进更多的一侧
- 如果一样，再退回 `close >= anchor` 作为 tie-break

这让 builder 的第一列更稳定，也减少了“只有几列就结束”的情况。

### 3. 列数少时默认视口展示整组 P&F 列

之前 workbench 的 `P&F` 默认视口仍然偏向“盯着最后几列”，所以当 builder 只产出十列以内时，看起来总像一团数据贴在右边。

现在的策略是：

- 如果 `logicalLength <= 14`
  - 直接把整组列放进默认 visible range，并给左右留一点 padding
- 否则
  - 继续走“看最后一段列”的窗口策略

这一步不是 cosmetic。对这类 price-based chart，默认 viewport 本身就是可用性的一部分。

## 为什么这比继续调 demo 更重要

因为 demo 只能决定“喂什么数据”，不能决定“同一份原始 K 线如何变成 P&F 列”。  
真正决定结构的是 builder。

这次之后：

- `Candles`
- `Heikin`
- `P&F`

至少都继续建立在同一份原始 K 线数据上，只是主序列的构造方式不同。

## 验证

- `pnpm test:unit`：通过
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "point-figure" --update-snapshots`：通过
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "point-figure" --update-snapshots`：通过

## 还没做的

- 这仍然不是 TradingView 等级的完整 P&F
- 还没有 ATR/Percentage 更精细的行业级公式对齐
- 也还没有更成熟的 P&F preset / scaling policy / viewport heuristics

但这次已经跨过了最关键的一步：  
`P&F` 不再主要靠 demo 参数“看起来像”，而是开始在 builder 语义上“更像”。  

## 这次顺手学到的点

### 1. 非时间图里，“builder 语义正确”比“renderer 画得漂亮”优先级更高

如果列本身就构错了，后面把 `X` 和 `O` 画得再精致，也只是在给错误结果做美化。

### 2. `high / low` 对 `P&F` 这类图型不是细节，是主信息

普通 K 线里很多时候可以先用 `close` 做最小 MVP，  
但在 `P&F / Renko / Kagi / Line Break` 这种 builder-driven chart 里，  
`high / low` 决定的不是修饰，而是“这一列到底存不存在”。  
