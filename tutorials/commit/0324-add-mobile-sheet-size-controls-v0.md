# 0324 add mobile sheet size controls v0

## 背景

前几笔已经把 workbench 的 right sidebar、trading panel、strategy panel 在窄视口下收成了
mobile sheet，但它们仍然只有“打开/关闭”两种状态。

对于 watchlist、indicators、strategy metrics 这类密度更高的内容，用户很快就会碰到一个
问题：想先快速看一眼，但有时又需要把 sheet 再展开一点。

## 这次要解决什么

- 给 mobile sidebar sheet 增加本地的 `Expand / Compact` 控制
- 给 mobile bottom sheet 也增加同样的大小切换
- 保持这次改动完全停留在 shell 层，不引入新的 runtime 或 host contract

## 改动概览

- 在 `src/lib/demo/components/MarketWorkbenchPanel.svelte` 中新增
  `mobileSidebarExpanded` / `mobileBottomPanelExpanded` 本地状态
- 给 mobile sidebar / bottom panel head 增加 `data-mobile-*-size-toggle`
  按钮和对应的 `data-mobile-*-size` 属性
- 在移动端样式里为 expanded 状态提高 `max-height`
- 在 `tests/visual/phase-one-harness.spec.ts` 中扩展现有 mobile focused tests，
  验证默认尺寸、切到 expanded、以及 close path
- 在 `docs/tradingview-alignment-plan.md` 的 `Multi-Device Productization` 章节补上进度说明

## 为什么这样做

### 1. 这比直接做 drag-to-dismiss 更稳

当前 mobile sheet 已经有稳定的 open/close seam。先加一个明确的 size toggle，能更低风险地验证
“sheet 需要多一种展示深度”这个产品事实，而不用一下跳到手势状态机。

### 2. 不引入新模型，避免把 device policy 提前塞进 public surface

这次只是在 shell 本地控制 `max-height`。也就是说：

- chart runtime 不需要知道 sheet 高度
- host contract 不需要开始携带 device profile
- public model 仍然保持干净

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "workbench mobile panels open as a sheet instead of forcing the sidebar inline|workbench mobile trading panel opens as a bottom sheet instead of staying inline|workbench mobile strategy panel opens as a bottom sheet instead of staying inline" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 还没有 drag-to-dismiss、snap heights、velocity-based gestures
- 还没有真实设备 safe-area / expanded-height screenshot baseline
- 还没有把 size 选择提升为跨会话持久化的 mobile preference
