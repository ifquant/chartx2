# 0160: 把 `Renko + requested-context moving-average` 升级成真正的 parity 契约

上一轮虽然把非时间主图的 requested-context 矩阵补齐了，但其中有一条其实还是弱约束：

- `Renko + requested-context moving-average`

它之前只验证了：

- study options 对
- pane metadata 对
- readout 命中了正确的 pane

这能证明“线路接通了”，但还不能证明“值是对的”。

## 这次收的是什么

这次直接把它升级成两层 parity：

1. unit 层

- 固定一组很小、可手算的原始 K 线
- 固定 `Renko box size = 4`
- 明确列出 renko bricks
- 明确列出 `carry-forward` merge 之后的 requested-context 序列
- 明确列出 `length = 2` 的 moving average 输出

这样 builder / merge / indicator 三层的语义就都不再靠猜。

2. API 层

- workbench 之外的真实 chart API 也改用同一组 deterministic 输入
- readout 不再只要求“有值”
- 而是直接锁住最后一个 SMA 值应为 `300`

## 这一步为什么重要

requested-context 的测试很容易滑到“只验证挂载”的弱约束里。  
如果不把至少一条链路做成 parity 契约，后面 merge 算法或 synthetic axis 行为改坏了，也可能还会“看起来都挂上去了”。

这次至少把一条最典型的非时间路径收成了：

- synthetic main = `Renko`
- requested-context input
- `carry-forward` merge
- indicator = `moving-average`
- readout value parity

## 现在的状态

这条之后：

- `Renko + requested-context compare`：有 API 契约
- `Renko + requested-context moving-average`：现在有真正 parity 契约

所以 `Renko` 这类非时间主图不再只是“能挂 compare / study”，而是至少有一条 study 路径开始锁具体值。

## 后面最值得继续的方向

如果继续往前收，最有价值的是：

1. 把 `Kagi` 或 `Line Break` 也补出一条 deterministic parity study
2. 把 requested-context merge 的参考语义再抽成更显式的 model-level policy 文档或测试夹具
