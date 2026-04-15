# 0162: 把 `Kagi + requested-context moving-average` 升级成 parity 契约

前两刀已经把：

- `Renko + requested-context moving-average`
- `Line Break + requested-context moving-average`

都补成了 deterministic parity。  
这次把同样的标准推进到 `Kagi`。

## 这次做了什么

还是两层一起收：

1. unit 层

- 固定一组能让 `Kagi` 产生三段明确折返的原始 K 线
- 明确锁住 `Kagi` synthetic segments
- 再把 requested-context 数据按 `carry-forward` merge 回这些 segments
- 最后锁住 `length = 2` moving-average 输出

参考值是：

- merged closes: `200, 240, 300`
- SMA2: `220, 270`

2. API 层

- workbench 之外的真实 chart API 也改用同一组 deterministic 输入
- 扫过 study pane，收集真实 readout 观察到的值
- 直接断言 chart 至少读到 `270`

这里仍然保留了和 `Line Break` 一样的做法：  
API 层锁住真实 readout 出现 parity 值，而不是强行把 hover 像素点和某个 synthetic segment 完全绑定死。

## 为什么这一步重要

这样一来，非时间主图里已经有三条 requested-context moving-average 进入真正的值契约：

- `Renko`
- `Line Break`
- `Kagi`

这意味着后面如果：

- merge 逻辑变了
- synthetic axis 对齐变了
- requested-context study 重新路由坏了

这些测试不再只是“study 还挂着”，而是会在具体值上报警。

## 之后还值得继续的方向

如果继续沿这条线收：

1. 把 `compare` 路径也补成 deterministic parity
2. 再看 `Point Figure` 是否需要一条同等级的 requested-context study parity
