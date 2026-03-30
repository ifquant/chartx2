# 0034: 统一基础 series 的 pane target 语义

这次提交继续沿 `pane architecture` 往前推，但没有直接做拖拽调高或多 series overlay，而是先把 `series -> pane` 的目标语义收成一套更一致的规则。

## 这次为什么值得先做

上一轮已经让 `secondary pane` 不再只给 `volume` 用，但 API 还是有点别扭：

- `addCandlestickSeries()` 只能挂主 pane
- `line/bar/histogram` 虽然能挂 secondary pane，但显式传主 pane handle 的行为并不统一
- `volume` 的默认行为和其它 series 也没有被明确建模

如果这层规则不先统一，后面继续加 pane lifecycle、pane resize 或多 pane indicators 时，public API 会越来越像一堆特例。

## 这次做了什么

1. 给 `addCandlestickSeries()` 也补上了 `target` 参数，让蜡烛图可以显式挂到某个 secondary pane。
2. 把 `line/bar/histogram` 的 target 解析统一成一套逻辑：
   - 不传 target，默认走主 pane
   - 传主 pane handle/index，就显式走主 pane
   - 传 secondary pane handle/index，就挂到对应 secondary pane
3. 保留 `volume` 的边界：
   - 默认仍走 secondary pane
   - 传 primary pane 会直接报错
4. 调整 readout 和渲染逻辑，让 secondary pane 上的 `candlestick/bar` 不再被当成只有一个价格值的 study。

## 对新人有帮助的两个点

1. “参数统一”本身就是架构工作。很多时候不是新功能难，而是要先把旧功能之间的规则讲清楚。
2. 图表库里的 `pane target` 不只是 UI 布局问题，它会直接影响 public API 形状、错误语义、渲染分发和 readout 行为。
