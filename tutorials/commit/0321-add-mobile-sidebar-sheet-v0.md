# 0321 add mobile sidebar sheet v0

## 背景

`Trading Ticket`、`Sync Status`、`Share Dialog` 这些 Layer 3 UI 壳已经接进了
workbench，但窄视口下的 workbench 仍然只是把右侧栏整体堆到图表下面。

这会直接挤压图表空间，和“桌面优先，但移动端不应强迫引擎妥协”的目标相冲突。

## 这次要解决什么

- 给窄视口 workbench 一个明确的 `Panels` 入口
- 让现有右侧栏内容在移动宽度下变成 sheet，而不是默认 inline 展开
- 保持这次切片只改 shell，不改 runtime、host contract、数据模型

## 改动概览

- 在 `src/lib/demo/components/MarketWorkbenchPanel.svelte` 里增加
  `mobileSidebarOpen` 本地状态和 `data-mobile-sidebar-trigger`
- 把现有 `workbench-sidebar` 在窄视口下改成 fixed sheet，配合 backdrop 和 close
  按钮收起
- 保持右侧栏内容复用原来的 watchlist / screener / alerts / indicators / sync /
  adapters 等 section，不做第二套内容树
- 在 `tests/visual/phase-one-harness.spec.ts` 增加 focused 窄视口用例，验证 trigger、
  open state、sheet 内容和 close path
- 在 `docs/tradingview-alignment-plan.md` 的 `Multi-Device Productization` 小节补上
  progress checklist 和实现边界

## 为什么这样做

### 1. 先解决“图表空间被侧栏吃掉”

当前最大的移动端问题不是缺一个新的数据模型，而是现有 shell 在窄宽度下把信息层级
排错了。图表是主画布，右侧栏应该在需要时再拉出。

所以这次先用最窄的 shell 变更把右侧栏收成 sheet。

### 2. 复用现有 sidebar 内容，避免做第二套移动端实现

右侧栏已经挂了很多 Layer 2/3 的 UI 表面。如果为了移动端再复制一套 watchlist、
alerts、sync、indicators，只会马上引入漂移。

这次直接让 `workbench-sidebar` 在移动宽度下切显示模式，内容仍然走同一棵 DOM 和同一组
selectors。

### 3. 为什么不在这次就做手势和密度系统

那已经超出当前 slice 的可信范围了。先证明：

- 移动端有明确 panel 入口
- 入口不会占据常驻图表空间
- 现有侧栏内容能通过 sheet 被访问

等这条 seam 稳定后，再继续做密度、触摸交互和设备 profile。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "workbench mobile panels open as a sheet instead of forcing the sidebar inline" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 还没有 touch gesture、drag-to-dismiss、safe-area 适配
- 还没有把 bottom panel 做成移动端 drawer/sheet
- 还没有设备 profile contract，也没有把密度策略提升到 public host surface
