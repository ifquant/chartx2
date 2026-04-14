# 0142: 先把 OX 图的默认观感从“字符墙”拉回可读

本次切片不是重写 `Point & Figure` builder，而是先修默认使用体验。

用户在 workbench 里切到 `P&F` 后，看到的是非常密的 `X/O` 列，像字符噪声，不像正常的 OX 图。原因并不是 renderer 丢了，而是默认参数太激进：

- engine 默认 `pointFigureBoxSize` 还是 `120`
- workbench 默认也用固定 `120`
- 当前 workbench 样例数据本身振荡频率高，导致列数被放大

在这种前提下，哪怕 builder 和 `X/O renderer` 都已经接上，默认图也会显得“还是不对”。

## 这次改了什么

### 1. 提高 engine 里的默认 P&F box size

文件：

- `/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts`

把默认 `pointFigureBoxSize` 从 `120` 调到 `360`。

这一步的意义是：不只是 workbench，所有没有显式传 P&F box size 的主图切换路径，默认都更保守，不会一上来就把 OX 图挤满。

### 2. 提高 workbench 的默认 P&F 参数和档位

文件：

- `/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts`

把 workbench 的默认 P&F 固定 box size 从 `120` 调到 `360`，同时把按钮档位从：

- `60`
- `120`
- `240`

改成：

- `180`
- `360`
- `720`

同时右侧指标文案也改成更明确的：

- `Fixed 360 pts · 3 rev`

这样用户在 workbench 切到 `P&F` 时，看到的默认图先是“能读”的，而不是必须先自己调参数才知道引擎有没有问题。

### 3. 增加 workbench 级视觉契约

文件：

- `/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts`
- `/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts-snapshots/phase-one-harness-point-figure-readable.png`

新增测试：

- 切到 `P&F`
- 断言 workbench 展示 `Fixed 360 pts`
- 锁住一张新的 workbench 截图基线

这样以后如果有人把默认 box size 又调小回去，或者让 workbench 的 OX 图再次变成字符墙，这条测试会直接失败。

## 这次没有做什么

这次没有去动更深的几件事：

- 没重写 `buildPointFigureData(...)` 的列构造算法
- 没引入 ATR / percentage / traditional 三种 box size 模式
- 没补更专业的 OX 图参数面
- 没解决所有数据集下的 P&F 可读性问题

所以这次是“先把默认体验救回来”，不是“P&F 已经完全对齐 TradingView”。

## 一个经验

像 `P&F / Renko / Kagi / Line Break` 这种非标准主图，默认参数本身就是产品体验的一部分。

如果默认参数把图压坏了，用户会误以为 builder 或 renderer 有 bug。  
所以这类图型不能只看“能不能画出来”，还要看“默认打开时是不是可读”。
