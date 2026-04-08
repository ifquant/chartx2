# 0064: 把 series 渲染裁剪回 pane plot 区

这次提交修的是一个真正的图表渲染正确性问题：首尾 K 线会画到 pane 边框外，看起来像“图形是从图外长出来的”。

用户截图里红框指出的问题是对的。那不是视觉偏好，而是 plot 区裁剪缺失。

## 根因是什么

在 [chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts) 里，每个 pane 的绘制流程大致是：

1. 画 pane 背景
2. 画网格
3. 画 series
4. 画 legend / crosshair / 边框

问题在第 3 步：虽然 pane 自己有边框和背景，但 series 绘制时没有对 plot 区做 `clip()`。  
这意味着首尾 bar 如果本来有一部分应该落在边界外，它们仍然会继续被画出来。

所以用户看到的效果就是：

- 左边第一根和右边最后一根 K 线，不像是被 plot area 边界截断
- 而像是从边框外面伸进来

## 这次怎么修

更新文件：

- [chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)

修法很直接：

- 在每个 pane 的背景和网格画完之后
- 开一个新的 canvas save/clip 区域
- 用 `rect(0, 0, paneWidth, pane.height)` 把后续 series 绘制裁进 plot 区
- 等 series 和 price lines 画完后再 `restore()`
- legend / crosshair / pane 边框保持在裁剪之外绘制

这样可以保证：

- series 本体被严格限制在 pane 内
- 但 overlay 和 frame 仍然能正常显示

## 为什么会连带改动多张截图

因为这个问题不是只影响一张 `Workbench` 首页图。

只要某个示例页里：

- 有首尾 series 靠近边界
- 或者有 pane 内多 series 组合

它的截图都可能改变。所以这次一起更新了：

- `Workbench` 系列截图
- `Panes` 分组示例截图
- 少量 public API 多 series 相关截图

这不是 scope 漂移，而是同一个渲染正确性修复的自然连带影响。

## 验证

这次实际跑过并通过：

```bash
pnpm check
pnpm test:visual --update-snapshots
pnpm build
```

## 这次没有做的事

这一步没有去改时间轴坐标模型，也没有去引入额外的首尾 padding 算法。当前修的是更基础的一层：

- 先保证 plot area 有正确的渲染裁剪

如果后面还觉得首尾视觉留白不够，那属于“时间轴边距/可视范围策略”的下一层问题，不该和这次裁剪缺失混在一起。

## 给新人的 2 个知识点

### 1. 图表的边框不等于绘制裁剪

很多人第一次写 canvas 图表时会以为“我已经画了边框，所以图形自然就在里面”。其实不是。  
边框只是视觉线条，真正限制图形不要画出去的是 `clip()`。

### 2. 为什么 legend/crosshair 不一起裁掉

因为它们属于 overlay 层，不是 series 本体。

- series 应该被限制在 plot 区内
- legend、crosshair、边框、轴标签这些往往需要在 plot 区边缘甚至外侧显示

所以正确做法通常不是“整张 pane 全部统一裁剪”，而是把不同绘制层分开处理。
