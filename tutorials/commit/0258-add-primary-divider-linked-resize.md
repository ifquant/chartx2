# 0258: 给 primary divider 补上下游 linked resize

上一笔 `0257` 已经把 pane frame consumer 收进 shared pane-layout owner 了，但 resize behavior 还留着一个明显缺口：

- `primary` 和它下面的 pane 之间的 divider
- 只要紧邻的 lower pane 不可调
- 这条 divider 就会直接失效

这在两层 secondary pane 的简单 case 里已经不够用了。

如果结构是：

- `primary`
- `pane-1` 固定高度
- `pane-2` 可调高度

那么用户直觉上还是会认为：

- 拖 `primary` 和 `pane-1` 之间的 divider
- 应该去带动下面真正可调的 `pane-2`

这次就是把这一刀补上。

## 1. 之前为什么不行

之前的 resize contract 其实只覆盖了“相邻 pane 里有一侧可调”：

- `resolvePaneDivider(...)`
  - 只看 divider 两侧是不是可调
- `resolveControlledPaneId(...)`
  - 只在上下两侧里挑控制对象
- `resolveControlledResizeHeight(...)`
  - 也默认 controlled pane 就是 divider 的上侧或下侧

所以哪怕 pointer-down 时已经知道：

- `primary`
- `pane-1` fixed
- `pane-2` resizable

后面的 resize policy 还是会在真正执行时把 `pane-2` 当成“非法 controlled pane”，因为它不是相邻 pane。

## 2. 这次改了什么

### A. `pane-model.ts`

先放宽 divider 的交互判定：

- 如果 divider 上侧是 `primary`
- 且它下面任意 downstream secondary pane 里存在可调 pane

那么这条 primary divider 仍然视为 interactive。

也就是说：

- `primary -> fixed -> resizable`

这类结构现在不会在 hit-test 阶段就被判死。

### B. `chart-pane-layout-policy-owner.ts`

这里补了真正的 linked-resize 语义：

- `resolveControlledPaneId(...)`
  - 如果相邻上下两侧都不可调
  - 且上侧是 `primary`
  - 就从 lower pane 往下扫描，选择第一个 resizable secondary pane

- `resolveControlledResizeHeight(...)`
  - 不再假设 controlled pane 必须是相邻 upper/lower
  - 允许 controlled pane 是 downstream validated target
  - 直接按 `controlledPaneId` 读取真实 pane

### C. `chart-pointer-runtime.ts` / `chart-view-state.ts`

这次还补了一个关键状态：

- `startControlledHeight`

原因很直接：

- 一旦 controlled pane 不是相邻 lower pane
- 就不能再拿 `startLowerHeight` 冒充 controlled pane 的初始高度

所以 pointer-down 现在会在锁定 `controlledPaneId` 的同时，把那个 pane 对应 frame 的真实初始高度一起存进 resize state。

这样 move-time policy 才能算对 delta。

## 3. 现在支持的具体行为

这次落地后的最小新能力是：

- `primary`
- `pane-1` fixed
- `pane-2` resizable

拖 `primary / pane-1` 之间的 divider 时：

- divider 仍然可交互
- pointer-down 会把 `pane-2` 锁成 controlled pane
- move-time resize 会改 `pane-2.preferredHeight`
- `pane-1` 保持不变

这还是一个有意收窄的 linked-resize slice，不是完整 multi-pane 联动算法。

## 4. 这一步为什么值得单独提交

因为它不是再拆一个 owner，而是把 pane/layout 线从“边界收口”推进到了“更真实的交互 contract”：

- 交互判定允许 primary divider 代理下游 resizable pane
- resize state 不再只够相邻 pane
- policy owner 终于能处理一个 downstream control target

这已经是行为层面的扩展，不只是整理结构。

## 5. 测试

这次补了两类新 coverage：

- `pane-model.test.ts`
  - primary divider 在 downstream 有 resizable secondary 时仍然 interactive
- `chart-pane-layout-policy-owner.test.ts`
  - primary divider 会解析到第一个 downstream resizable secondary
  - downstream controlled pane 的 resize height 计算正确
- `chart-pane-runtime.test.ts`
  - primary divider drag 会真正更新下游 resizable pane

同时把所有 resize-state 相关测试补到了新的字段：

- `startControlledHeight`

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts tests/unit/pane-model.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有做完整 multi-pane linked resize 算法
- 没有改更广义的 multi-layout ownership
- 还没有处理多个 fixed secondary panes 之间更复杂的联动分配策略
