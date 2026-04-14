# 0154 Restore Line Break Secondary Panes As Chart-Context Series

这次收的是 `Line Break` 在 workbench 里的一个明显产品缺口：主图已经切到 synthetic/compressed path 了，但下面的 volume/study pane 被整段关掉，导致用户一切到 `Line Break` 就像“主图有了，附图全没了”。

## 为什么之前会被关掉

因为下方两条 pane 原来直接吃原始 time-based `bars`：

- volume 用 `createVolumeData(bars)`
- study line 用 `createLineData(bars, ...)`

而 `Line Break` 主图已经改成 compressed synthetic sequence。

如果还把原始 time-based volume/study 挂回去，会重新把共享横轴撑回原始时间长度，主图就会被压扁或者错位。所以之前先临时把 secondary panes 整段压掉。

## 这次怎么改

不是把旧数据硬挂回去，而是改成让 workbench 的 lower panes 跟随 `Line Break` 的 synthetic rows：

1. 先复用已有 builder：
   - `const lineBreakRows = buildLineBreakData(bars, lineBreakCount)`
2. 再从这些 synthetic rows 派生：
   - `lineBreakVolume = createVolumeData(lineBreakRows)`
   - `lineBreakLine = createLineData(lineBreakRows, 6)`
3. 然后 volume/study pane 改吃这两份 chart-context 数据

这样它们和主图共享的是同一条 synthetic logical domain，而不是原始 time bars。

## 为什么还没把默认 drawings 也挂回来

这次只恢复 lower panes，没有把默认画线一起恢复给 `Line Break`。

原因很简单：默认 `horizontal-line / trend-line` 现在还是按普通示例时间点在 workbench 里塞进去的。`Line Break` 主图既然已经是 synthetic main，就不该再顺手把一套未经适配的默认 drawing 一起带回来，否则会引入另一轮“主图对了、画线又不对”的噪声。

所以当前策略是：

- `Line Break`：恢复 chart-context lower panes
- `Line Break`：继续压住默认 workbench drawings

## 结果

现在 `Line Break` 在 workbench 里会恢复成：

- 主图：compressed synthetic `Line Break`
- Pane 2：跟随 synthetic rows 的 volume
- Pane 3：跟随 synthetic rows 的 study line

也就是说，至少在 demo/workbench 这条路径里，`Line Break` 不再是“主图一切换，下面全空”。

## 验证

- `pnpm check`
- `pnpm test:unit`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "line-break" --update-snapshots`

## 还没做

- 这还是 workbench 级的 chart-context 恢复，不等于 engine 已经拥有完整的 synthetic-study 通用语义
- `Line Break` 下的默认 drawings 仍然被压住
- 更通用的 `requested-context + merge` 还没有回到这条路径里
