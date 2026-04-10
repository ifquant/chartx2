# 背景

在 workbench 里切到 `Renko` 后，用户看到的是：

- 右侧状态已经显示主图类型是 `Renko`
- `Renko` 控制条也出现了
- 但主 pane 看起来像空白，没有砖块

这不是 `Renko` builder 没产出数据，而是一个更底层的模型问题暴露出来了。

# 根因

当前 phase-one 的 chart runtime 仍然假设所有 panes 共用同一个“按点数推进”的逻辑时间轴。

这对普通 time-based 系列没问题，但对 `Renko` 这种 price-based synthetic series 会出错：

- `Renko` 主图会生成大约 `9148` 个 bricks
- volume / study panes 仍然是原始 `10000` 根 time-based 数据
- 共享 `timeScale` 取了更长的 `10000` 域
- `Renko` 主图的最后一块停在 index `9147`
- 当前视口却在看最右端 `10000` 域的尾部

结果就是：主图其实有数据，但被共享时间轴的末端视口甩出去了，所以肉眼看起来像空白。

# 这次改了什么

- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - 当主图类型为 `renko` 时，workbench 暂时不再挂载 time-based volume pane 和 study pane
  - snapshot 说明文案会明确提示：这是 phase-one 共享时间轴限制下的临时绕行

# 为什么这样修

这次没有假装“引擎已经支持 synthetic main 和 time-based secondary 混挂”，因为事实并不是这样。

如果直接继续保留 secondary panes，主界面会持续呈现“主图空白”的错误效果。对当前阶段来说，这比暂时关闭 secondary panes 更误导。

所以这里选择的是：

- 在 demo 层做受控降级
- 让 `Renko` 主图至少能正确可见
- 同时保留一个清晰的后续引擎任务：补 logical index alignment

# 关键知识

共享时间轴不等于“所有系列都必须一根原始 bar 对一根显示 bar”。

一旦你开始支持 `Renko / Kagi / Line Break / Point & Figure`，时间轴模型就不只是“统一 pointCount”这么简单了，而是需要定义：

- synthetic main 的 logical range 如何映射
- time-based secondary overlays / panes 如何跟它对齐
- 哪些 pane 允许混挂，哪些必须隔离

# 验证

- `pnpm check`（PASS）
- `pnpm test -- --grep "workbench surfaces renko builder controls|workbench opens by default|renko main series can take a fixed box size|switch the active main chart type to renko"`（PASS）

# 未覆盖项

- 这次只是 workbench 层的临时修复，不是底层 shared time scale 对齐能力的最终实现
- `Renko` 模式下 volume/study pane 暂时被禁用，而不是被正确同步
