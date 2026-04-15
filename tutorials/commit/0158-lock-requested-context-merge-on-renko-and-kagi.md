# 0158: 锁住 Renko / Kagi 上的 requested-context merge 契约

上一刀已经把：

- `Point Figure + requested-context compare`
- `Line Break + requested-context moving-average`

补成了 API 契约。

这次继续沿同一条线把剩下两类非时间主图也补齐：

- `Renko + requested-context compare`
- `Kagi + requested-context moving-average`

## 为什么这一步值得单独做

因为如果只看 workbench 或只看 `chart-context` lower panes，很容易误以为“非时间主图下的 study policy 已经统一了”。

实际上还差一层更关键的保证：

- 主图已经是 compressed synthetic sequence
- study 仍然可以请求另一上下文
- merge 后的数据还能稳定落回当前 synthetic bars

如果这条不锁住，后面任何一次 `Renko / Kagi` builder 或 axisBars 变动，都可能先把 requested-context merge silently 弄坏，而 workbench 不一定第一时间看得出来。

## 这次具体做了什么

### 1. `Renko + requested-context compare`

新增 API 契约：

- 主图切成 `renko`
- `compareSeries` 走 `requested-context`
- `mergePolicy = carry-forward`
- 通过 pane snapshot 和 readout 断言它确实挂回当前 compressed renko bars

### 2. `Kagi + requested-context moving-average`

新增 API 契约：

- 主图切成 `kagi`
- `movingAverage` 走 `requested-context`
- 在独立 study pane 上读取 readout
- 断言 indicator 的 `inputContextMode` 和最终值都还成立

## 这一步的意义

到这里，非时间主图里已经有一组比较完整的 requested-context 覆盖：

- `Point Figure`：compare
- `Line Break`：moving-average
- `Renko`：compare
- `Kagi`：moving-average

虽然还不是每种 study × 每种非时间主图的全矩阵，但已经从“只有 chart-context lower panes 可用”推进到了“requested-context merge 也有跨图型约束”。

## 还没做的

这次仍然只是把契约锁住，没有继续改 merge 算法本身。

如果后面继续收这条线，下一步更合理的是：

1. 补 `Renko / Kagi` 另一半矩阵（例如 `Renko + moving-average`、`Kagi + compare`）
2. 再看是否需要把 `requested-context` 行为抽成更显式的 synthetic-study policy 文档/API 面
