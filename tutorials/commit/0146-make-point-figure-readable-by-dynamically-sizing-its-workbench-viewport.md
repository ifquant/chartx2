# 0146: 让 Point & Figure 在 workbench 中先达到可读状态

本次切片没有再继续用固定参数硬顶 `P&F` 的默认观感，而是把问题拆成两层分别处理：

1. `X/O` 字形尺寸不能继续和列宽线性绑定，否则列一旦变宽，`X` 和 `O` 就会互相压住。
2. `P&F` 的默认视口不该靠猜测 spacing，而应该先看 builder 实际产出了多少列，再决定默认横向铺法。

## 这次改了什么

### 1. 收紧 `P&F` renderer 的字形尺寸

之前 `point-figure-renderer.ts` 里是：

- `size = floor(barWidth)`

这会导致列宽一放大，`X/O` 也同步失控变大。现在改成：

- 同时参考 `barWidth` 和单个 box 的像素高度
- 再加一个硬上限

这样列可以更宽，但字符不会继续无限长大。

### 2. 改进 `auto box size` 的推导

之前的 `inferPointFigureBoxSize(...)` 更像是“避免太小”，但没有真正朝“生成足够列数”这个目标去推。

现在它同时参考：

- 总价格区间
- 平均 close-to-close 变化
- 平均 bar range
- reversal 盒数
- 目标列数/每列目标 box 数

结果是 `auto` 模式不再轻易把 box size 推到过大，从而只生成很少几列。

### 3. workbench 的 `P&F` 默认视口改成按实际列数动态计算

这次最关键的不是单纯再调一个固定 `barSpacing`，而是：

- 先用当前 `P&F` 配置跑一遍 builder
- 再把 rows 转成 direction-column sequence
- 读取真实 `logicalLength`
- 最后按这个列数计算默认 `barSpacing`

这样默认视口是“跟随当前 `P&F` 产物”的，而不是拍脑袋写死一个 spacing。

## 为什么之前会出现“都挤在右边”

因为在 price-based 图里，如果默认视口没有按真实列数去铺开，time scale 会自然把最后几列右对齐显示。  
再叠加过大的 `X/O` 字形，最后看起来就像：

- 数据很少
- 列全在右边
- `X/O` 还互相重叠

实际上是“视口策略 + renderer 尺寸策略”同时出错。

## 一个实现上的提醒

对 `P&F / Renko / Kagi / Line Break` 这类 price-based 图，**builder 决定结构，viewport 决定默认可读性，renderer 决定最终观感**。  
这三层不能混成一个问题去修，否则就会不停在“调 box size”和“换 demo 数据”之间打转。

## 这次怎么验证

- `pnpm check`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "point-figure opens with a readable auto box size" --update-snapshots`

## 还没做的

- `P&F` builder 还不是完整的 TradingView 级实现
- 还没有 ATR / Percentage 这类更完整的 box-size 模式
- 这次主要先把 workbench 默认观感拉回“能读”的水平
