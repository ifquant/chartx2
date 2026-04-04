## 这次提交做了什么

这次把 `chartx2` 的 pane 架构从“每个 secondary pane 最多一条 series”推进到了“受控的 multi-series per pane”。

当前范围仍然是克制的：

- `primary pane` 继续保持单主图槽位
- `secondary pane` 现在可以挂多条 secondary series
- pane snapshot、pane event、渲染和移除约束都同步跟上

这让 `chartx2` 往真正的 `lightweight-charts` / TradingView 式多研究 pane 结构又前进了一步，但还没有直接放开成无限自由组合。

## 为什么这样切

如果一上来就做“任意 pane、任意 series、任意 overlay”，改动面会一下子炸开：

- pane price scale 共享规则会不清楚
- pane readout 语义会不清楚
- 移除和快照规则也会变得模糊

所以这一步先做一个工程上更稳的版本：

1. secondary pane 可以持有多条 secondary series
2. 同一个 pane 内的 secondary series 共享 pane price scale
3. pane snapshot 能把多条 series 一起描述出来
4. 回归测试先锁住一个稳定场景

这样后面再继续扩展时，不会因为底层状态模型先天太窄而返工。

## 新人知识点 1：为什么同一个 pane 里的多条 series 要共享 price scale

如果一个 pane 里有两条 series，但它们各自用不同的 price scale 去映射像素坐标，那么它们虽然都画在同一块画布区域里，视觉上却不是在同一个坐标系里。

这会让：

- 交叉线读数难以解释
- 价格轴标签没有统一意义
- 多 series 对比失真

所以同 pane 多 series 的第一原则通常是：

`先共享 pane 的纵轴，再讨论更复杂的 overlay / 独立 scale 模式。`

## 新人知识点 2：为什么 pane snapshot 要带 series 列表，而不是只带 seriesCount

`seriesCount` 只能告诉宿主“这里有几条线”，但不能告诉它“到底是哪几条线”。

真正做面板 UI、study 列表、pane inspector 时，宿主更需要的是：

- `id`
- `label`
- `kind`
- `pointCount`

这样 host 层才不必重新摸进 engine internals，也能把 pane 当前挂载的研究结构展示出来。
