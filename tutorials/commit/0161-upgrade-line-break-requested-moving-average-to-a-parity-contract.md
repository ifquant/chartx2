# 0161: 把 `Line Break + requested-context moving-average` 升级成 parity 契约

上一刀已经把：

- `Renko + requested-context moving-average`

收成了真正的数值 parity 契约。  
这次继续沿同一路线，把 `Line Break` 也补到同等级。

## 这次做了什么

还是分成两层：

1. unit 层

- 固定一组 6 根原始 K 线
- 让 `Line Break(3)` 产出一组可手算的 synthetic bars
- 再把 requested-context 数据按 `carry-forward` merge 回这些 bars
- 最后锁住 `length = 2` moving-average 输出

这次的参考值是：

- merged closes: `200, 200, 240, 240, 300`
- SMA2: `200, 220, 240, 270`

2. API 层

- 用同一组 deterministic 输入驱动真实 chart API
- 不再只是断言 study 被挂到正确 pane
- 而是扫过 study pane，确认真实 readout 曾经出现 `270`

这里没有强行把光标和最后一个 synthetic bar 的像素点做一一绑定，  
而是先锁住“真实 chart 读到了 parity 值”。

## 为什么这一步有意义

到这一步之后，非时间主图里至少已经有两条 requested-context moving-average 不是“线路测试”，而是开始锁数值语义：

- `Renko`
- `Line Break`

这能明显减少后面 merge 或 synthetic axis 行为变坏时的假绿测试。

## 后面还值得继续的方向

如果继续往前收，最自然的是：

1. 给 `Kagi` 也补出一条 deterministic parity study
2. 再把 compare 路径也补到同等级的 deterministic parity
