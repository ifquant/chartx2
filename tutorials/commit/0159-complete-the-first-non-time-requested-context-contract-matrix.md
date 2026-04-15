# 0159: 补齐第一版非时间主图 requested-context 契约矩阵

上一轮已经把两条关键路径锁住了：

- `Point Figure + requested-context compare`
- `Line Break + requested-context moving-average`

但这还不够，因为非时间主图里真正容易回归的不是某一个图型，而是：

- compressed synthetic main
- requested-context study
- merge back to current chart bars

这三件事在不同 chart type 下能不能都站住。

## 这次补了什么

继续按同一口径把剩下两类非时间主图补上：

- `Renko + requested-context compare`
- `Renko + requested-context moving-average`
- `Kagi + requested-context compare`
- `Kagi + requested-context moving-average`

其中：

- `compare` 继续在 primary pane 上验证
- `moving-average` 继续在独立 study pane 上验证

这样 `Point Figure / Line Break / Renko / Kagi` 四类非时间主图，至少各自都已经有了 requested-context merge 的 API 契约，而不是只剩 workbench 看起来“差不多”。

## 一个实际取舍

`Renko + requested-context moving-average` 这条，在当前测试数据和 synthetic row 密度下，readout 的具体数值并不稳定。  
这次没有硬把它包装成“值完全对齐”，而是先锁住：

- study options 正确
- pane metadata 正确
- readout 确实命中对应 study pane

也就是说，这条目前锁的是“路由/挂载契约”，不是更强的数值 parity 契约。

## 这一步之后的状态

现在第一版非时间 requested-context 契约矩阵已经闭合：

- `Point Figure`：compare
- `Line Break`：moving-average
- `Renko`：compare + moving-average
- `Kagi`：compare + moving-average

还不代表所有组合都做完了，但已经从“局部例子”推进到了“同一类问题有系统约束”。

## 后面还可以怎么继续

如果继续往前收，下一步更值钱的不是再多写几个截图，而是二选一：

1. 把 `Renko + requested-context moving-average` 提升成真正的数值 parity 契约
2. 把这些 requested-context 行为抽成更显式的 synthetic-study policy 文档 / API 面
