# 0326 add mobile snap heights and navigation close v0

## 背景

前面的 `Multi-Device Productization` 切片已经让 mobile sheets 具备：

- open / close
- safe-area-aware bottom spacing
- size toggle
- handle-based drag-dismiss

但还有两个很直接的壳层问题：

1. size toggle 只有 `default / expanded`，深内容还是不够自然
2. 用户切 workspace tab 或 bottom tab 时，mobile sheet 可能还挂在旧上下文上

## 这次要解决什么

- 把 mobile sidebar / bottom sheet 的尺寸状态收成 `default / expanded / full`
- 让 workspace / bottom-tab 这类导航动作自动收起 mobile sheets

## 改动概览

- 在 `src/lib/demo/components/MarketWorkbenchPanel.svelte` 中，把两个旧的
  `expanded` boolean 收成更窄的 snap enum
- 新增本地 helper：
  - `nextMobileSheetSize(...)`
  - `closeMobileSidebarSheet()`
  - `closeMobileBottomSheet()`
  - `closeMobileSheetsForNavigation()`
- 给 workspace tab 主按钮增加 `data-workspace-tab-trigger`
- 让 workspace tab / bottom tab / tab create / tab close 这些导航入口都先收起
  mobile sheets，再继续原来的 shell 切换
- 在 `tests/visual/phase-one-harness.spec.ts` 中补 focused coverage：
  - sidebar size cycle: `default -> expanded -> full -> default`
  - trading bottom sheet size cycle
  - strategy bottom sheet size cycle
  - sidebar auto-close on workspace navigation
  - bottom sheet auto-close on bottom-tab navigation

## 为什么这样做

### 1. 先做 snap enum，比直接做 gesture physics 更稳

这一步解决的是“现在这个 panel 想再看深一点怎么办”。它本质上是状态建模问题，
不是动画问题。

所以这次先把 sheet size 从二元状态收成一个小 enum，而不是直接跳去实现复杂 gesture。

### 2. auto-close 是移动壳层的一致性修复

当用户换 workspace 或切 bottom tab 时，旧 sheet 如果还开着，会让当前 UI 焦点和
用户感知错位。

把“导航前先关闭 mobile sheets”收成统一 helper，比在每个新动作里临时补一段关闭逻辑更稳。

### 3. 为什么测试用 attributes，不测像素高度

subagent 也指出了这一点：当前 sheet 高度是 CSS `max-height` + safe-area 组合出来的，
直接测像素会很容易漂。

所以这次 focused tests 锁的是：

- `data-mobile-*-size`
- `data-mobile-*-open`
- 导航后的 active state

这对当前 slice 更可靠。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "workbench mobile panels open as a sheet instead of forcing the sidebar inline|workbench mobile trading panel opens as a bottom sheet instead of staying inline|workbench mobile strategy panel opens as a bottom sheet instead of staying inline|workbench mobile sidebar sheet can be drag-dismissed from the handle|workbench mobile bottom sheet can be drag-dismissed from the handle|workbench mobile sidebar sheet ignores short drag gestures below the dismiss threshold|workbench mobile sidebar sheet auto-closes when workspace navigation changes|workbench mobile bottom sheet auto-closes when bottom-tab navigation changes" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 还没有 live drag follow、velocity-based dismiss、或 drag-to-snap
- 还没有“full”状态下的真实设备截图基线
- 还没有把 snap size 提升成跨会话持久化的 mobile preference
