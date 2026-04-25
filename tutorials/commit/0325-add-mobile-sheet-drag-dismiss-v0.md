# 0325 add mobile sheet drag dismiss v0

## 背景

前面的 `Multi-Device Productization` 切片已经给 workbench 的 mobile sidebar 和
mobile bottom sheets 加上了：

- open / close
- compact / expanded size
- safe-area-aware bottom spacing

但它们还缺一个更符合移动端直觉的关闭动作：向下拖一下 handle 就能收起。

## 这次要解决什么

- 给 mobile sidebar sheet 增加 handle-based downward dismiss
- 给 mobile bottom sheet 也增加同样的 downward dismiss
- 用 focused tests 把“超过阈值会关、没超过不会关”一起锁住

## 改动概览

- 在 `src/lib/demo/components/MarketWorkbenchPanel.svelte` 增加
  `beginMobileSheetDrag / endMobileSheetDrag / cancelMobileSheetDrag`
- 给 mobile sidebar 和 mobile bottom panel 的 head 都加上 drag handle
- 用固定 `72px` 下拉阈值触发 dismiss，而不是直接上复杂的 spring / velocity 模型
- 在 `tests/visual/phase-one-harness.spec.ts` 补三个 focused 场景：
  - sidebar handle drag-dismiss
  - sidebar 短拖动不会误关闭
  - bottom sheet handle drag-dismiss
- 在 `docs/tradingview-alignment-plan.md` 的 `Multi-Device Productization`
  小节登记这条进度

## 为什么这样做

### 1. 先做 deterministic dismiss，不急着做 full gesture physics

用户真正需要的第一件事不是“动画特别拟真”，而是“这个 sheet 能不能像移动端那样顺手收起来”。

所以这次先做：

- 专用 handle
- 明确阈值
- focused tests

这样交互已经够像移动端，而且行为边界清楚。

### 2. 为什么只绑在 handle 上

如果把 drag-dismiss 绑到整个 sheet body，就会马上和内部滚动冲突。尤其是：

- sidebar 本身内容密、可滚动
- bottom panel 里 strategy/trading 也都是重内容

先把 dismiss 限定在 handle 上，是最稳的第一版。

### 3. 为什么测试改成 pointer events

subagent review 也确认了这一点：对这种 element-level pointer logic 来说，
直接 `dispatchEvent("pointerdown"/"pointerup")` 比 `page.mouse` 更稳，也更符合我们
这次没有实现 live drag motion 的真实行为。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "workbench mobile panels open as a sheet instead of forcing the sidebar inline|workbench mobile trading panel opens as a bottom sheet instead of staying inline|workbench mobile strategy panel opens as a bottom sheet instead of staying inline|workbench mobile sidebar sheet can be drag-dismissed from the handle|workbench mobile bottom sheet can be drag-dismissed from the handle|workbench mobile sidebar sheet ignores short drag gestures below the dismiss threshold" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 还没有 live drag follow、velocity-based dismiss、snap heights
- bottom sheet 的“短拖动不关闭”目前没有单独 focused test
- 还没有真实移动设备上的 gesture feel 调整
