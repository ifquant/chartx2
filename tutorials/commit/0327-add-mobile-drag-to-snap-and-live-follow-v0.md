# 0327 add mobile drag-to-snap and live follow v0

## 背景

前面的 mobile shell 切片已经让 workbench 的 sidebar / bottom sheets 有：

- open / close
- safe-area padding
- snap size cycle
- handle-based drag dismiss
- navigation auto-close

但拖动体验还停在最初级阶段：只能“向下拖一段然后关闭”，没有真正的 live follow，也没有
把 upward drag 用来推进更高的 snap size。

## 这次要解决什么

- 给 mobile sidebar / bottom sheet 加上 drag 时的 live follow
- 让 upward drag 可以把 sheet 从 `default -> expanded -> full`
- 保持 downward drag 仍然优先用于回落和 dismiss，不引入完整物理动画系统

## 改动概览

- 在 `src/lib/demo/components/MarketWorkbenchPanel.svelte` 中，为现有 mobile drag
  路径增加 `mobileDragOffsetY`
- 新增 `updateMobileSheetDrag(...)`，在 handle 拖动中持续更新 offset
- 在 `sidebar` / `bottom-panel-body` 上暴露：
  - `data-mobile-*-dragging`
  - `data-mobile-*-drag-offset`
  - `--mobile-drag-offset`
- 在移动端 CSS 中把这个 offset 接到 `transform: translateY(...)`
- 保持当前持久化状态仍然只有：
  - `open`
  - `size`

拖动本身只作为 transient UI state，不引入新的 runtime surface。

## 为什么这样做

### 1. 先把“拖起来像拖动”这件事补齐

之前的 dismiss 已经可用，但从用户角度看，它更像一个“释放时判阈值”的按钮，不像真正的
mobile sheet。

这次加上 live follow 后，拖动过程本身就能反馈当前位置，更接近真实移动端感觉。

### 2. upward drag 比继续堆按钮更自然

sheet 已经有 `default / expanded / full` 三个 snap size 了。如果还只靠按钮切，
会让触摸路径割裂。

所以这次把 upward drag 接进同一条 size ladder：

- 上拖一步到 `expanded`
- 再上拖一步到 `full`

downward 仍然保留回落和 dismiss 逻辑。

### 3. 为什么不直接做 full physics

这一步仍然刻意保守：

- 没有 velocity
- 没有 spring
- 没有 drag-to-snap animation curve

因为当前目标是先把语义和测试边界收稳，而不是一次做完整 gesture engine。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "workbench mobile panels open as a sheet instead of forcing the sidebar inline|workbench mobile trading panel opens as a bottom sheet instead of staying inline|workbench mobile strategy panel opens as a bottom sheet instead of staying inline|workbench mobile sidebar sheet can be drag-dismissed from the handle|workbench mobile bottom sheet can be drag-dismissed from the handle|workbench mobile sidebar sheet ignores short drag gestures below the dismiss threshold|workbench mobile sidebar sheet supports upward drag-to-snap and live drag follow|workbench mobile bottom sheet supports upward drag-to-snap and live drag follow|workbench mobile sidebar sheet auto-closes when workspace navigation changes|workbench mobile bottom sheet auto-closes when bottom-tab navigation changes" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 还没有 velocity-based dismiss / snap physics
- downward drag 目前还是直接看 release delta，没有 spring settle
- 还没有真实移动设备上的 gesture tuning 或 screenshot baseline
