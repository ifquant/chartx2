# 0195 - 移动 Pane Chrome Drawing

## 背景

`chart-harness` 底部还保留了两个 canvas presentation helper：

- `drawCrosshair`
- `drawPaneLegend`

它们已经通过 render coordinator 的 deps 被调用，但具体绘制细节仍然定义在 harness。pane legend 和 pane-local crosshair 属于 pane chrome presentation，应该放到 `chart-pane-chrome` 附近。

## 改动

- 在 `chart-pane-chrome.ts` 中新增 `drawPaneCrosshair` 和 `drawPaneLegend`。
- `chart-harness` 改为导入这两个 pane chrome drawing helper。
- 删除 harness-local `drawCrosshair`、`drawPaneLegend` 和随之无用的 `toCoordinate`。
- 扩展 `chart-pane-chrome.test.ts`，覆盖 crosshair draw commands 和 legend chip draw commands。
- 架构文档补充 pane chrome drawing primitives 应离开 harness。

## 为什么没有行为变化

绘制命令原样移动：

- crosshair 仍然画垂直线、水平线和中心点。
- line dash 仍然是 `[4, 4]`。
- legend chip 仍然使用同样的 font、背景、边框、圆点和文字位置。

render coordinator 的接口不变，harness 只是把 dependency implementation 指向新模块。

## 这一刀的价值

### 1. pane chrome ownership 更完整

`renderPaneChrome` 已经负责 pane-local legend/crosshair routing。把实际 draw primitive 放在同一模块，边界更清楚。

### 2. harness 少一块 canvas presentation

harness 不再定义 pane chrome 的 canvas 绘制细节，继续向 composition root 收缩。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-pane-chrome chart-render-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-pane-chrome.ts tests/unit/chart-pane-chrome.test.ts docs/chart-workstation-architecture.md tutorials/commit/0195-move-pane-chrome-drawing.md`

## 还没做

- 没有改 render coordinator interface。
- 没有移动 readout CustomEvent dispatch。
- 没有移动 canvas attach guard。
