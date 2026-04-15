## 为什么要做这一刀

前一轮给 `Kagi` 补了 dedicated renderer 和更可读的默认视口，但它仍然没有像 `P&F` 那样的产品级参数面。结果是：

- 用户只能接受一个默认 `auto reversal`
- workbench 里没有办法切 `auto / fixed / atr / percentage`
- `getMainSeriesState()` / `applyMainSeriesState()` 也带不走 `Kagi` 的主图语义

这会让 `Kagi` 一直停在“看起来像一个图型，但还不是一个真正可配置的主图”。

## 这次改了什么

### 1. 给 `Kagi` 增加独立 style state

在 model 层新增了 `KagiStyleOptionsState`，字段和 `P&F` 的思路一致：

- `reversalMode`
- `reversalSize`
- `reversalScale`
- `atrLength`
- `percentageValue`

同时把它接进：

- `MainSeriesStyleOptionsTarget`
- `MainSeriesStyleOptionsPatch`
- `kagiStyle` applier

这样 `Kagi` 的参数不再只是 UI 层局部状态，而是主图 style/runtime state 的一部分。

### 2. 把 `Kagi` style schema 做实

`kagiStyle` 不再只有通用的 `color / lineWidth`，现在已经有：

- `kagiYangColor`
- `kagiYinColor`
- `kagiYangLineWidth`
- `kagiYinLineWidth`
- `kagiReversalMode`
- `kagiReversalSize`
- `kagiReversalScale`
- `kagiAtrLength`
- `kagiPercentageValue`

这样 snapshot、template、pane metadata 才知道 `Kagi` 真正有哪些专属字段。

### 3. builder 现在真的吃 `Kagi` 配置对象

`buildKagiData(...)` 之前本质上只吃一个 reversal number。现在它改成吃完整 options：

- `auto`
- `fixed`
- `atr`
- `percentage`

并按模式选择：

- inferred auto reversal
- ATR reversal
- percentage reversal
- fixed reversal

这一步的关键意义是：workbench 上的模式切换不再是假开关，而是真正驱动 builder 行为。

### 4. renderer 支持 `yang / yin` 专属样式

`KagiRenderer` 现在不再只吃一套统一 `lineColor / lineWidth`，而是分开接：

- `yangColor`
- `yinColor`
- `yangLineWidth`
- `yinLineWidth`

这样后面再补更完整的 `Kagi` 视觉语义时，至少 renderer 数据面已经对了。

### 5. workbench 补齐了 `Kagi` 控制面

右侧卡片现在会显示：

- mode
- effective reversal
- visible columns

并提供：

- `Auto`
- `ATR`
- `%`
- `Fixed`

以及对应滑杆：

- auto/atr 的 `Scale`
- atr 的 `ATR length`
- percentage 的 `Percent`
- fixed 的 `Fixed reversal`

所以这次之后，`Kagi` 在 workbench 里第一次变成了“可调参数的主图”，而不是只能接受默认值。

## 验证

- `pnpm check` (`PASS`)
- `pnpm test:unit` (`PASS`)
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "kagi" --update-snapshots` (`PASS`)
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "kagi" --update-snapshots` (`PASS`)

## 还没做的

- 这还不是 TradingView 等级的 `Kagi` parity，尤其肩/腰和更严格的 yang/yin 规则还没补
- `Kagi` 的颜色/线宽虽然已经有 schema 和 renderer 数据面，但 workbench 里还没有对应的样式控件
