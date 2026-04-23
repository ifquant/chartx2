# 0272: 把 controlled resize math 收进 pane-resize-block owner

上一笔 `0271` 已经把 pane layout policy 的输入收窄成了：

- `resizeHandle`
- `deltaY`

这让 policy 层不再知道：

- `startClientY`

这种 interaction lifecycle 字段。

但当时还有一半工作没做完：

- block validation
- grouping
- controlled resize math

这些逻辑虽然都已经围绕 `pane-resize-block owner` 打转，但真正的高度计算公式还留在：

- [chart-pane-layout-policy-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts)

这就让 `pane-layout-policy-owner` 仍然同时扮演两种角色：

- pane layout normalization owner
- pane resize block math owner

这次就是把后者彻底拿走。

## 1. 现在谁真正负责 controlled resize math

现在真正负责：

- validated group
- controlled pane 判定
- upper/lower 控制方向
- clamp
- nextHeight 计算

的是：

- [chart-pane-resize-block-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-resize-block-owner.ts)

新增方法是：

- `resolveControlledResizeHeight(...)`

它接收：

- `deltaY`
- `resizeHandle`
- `getPaneById`
- `listPanes`
- `normalizeHeight`

返回：

- `{ paneId, nextHeight }`

这样 pane block 相关的核心链路就真正聚到一个 surface 里了。

## 2. `chart-pane-layout-policy-owner` 现在还剩什么

`chart-pane-layout-policy-owner` 现在更接近一个薄壳：

- `normalizePreferredHeight(...)`
- 对 pane-resize-block owner 的少量转发

也就是说：

- pane layout policy
- 不再自己持有 resize block validation 和 controlled resize 公式

它现在只负责：

- “pane layout 自己的归一化边界”
- “把 resize 相关请求转给 shared pane block surface”

这比之前的职责切分干净得多。

## 3. 为什么这一步值得单独提交

这次没有新增 linked-resize 用户行为。

但它把 pane resize 这条线从：

- “shared owner + thin wrappers + 一半逻辑还在 policy”

推进成：

- “shared owner 真正承接 block math”

这是继续做 runtime ownership 的前提，因为后面如果要把 pane block 提升成更明确的 runtime root，就不应该再让 math 分散在另一个 owner 里。

## 4. 测试

新增/更新：

- [chart-pane-resize-block-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-resize-block-owner.test.ts)
- [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts)
- [chart-pane-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-runtime.test.ts)

重点覆盖：

- pane-resize-block owner 自己能算 controlled resize height
- pane-layout-policy-owner 继续作为薄壳工作，不改现有行为
- pane runtime 仍然能正确把 delta 和 handle 路由到新 owner 路径

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-resize-block-owner.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check`

## 未包含

- 没有新增 linked-resize 用户行为
- 还没有把 pane-resize-block owner 提升成真正的 runtime root 或稳定 identity owner
- 这一步先把 block resize math 真正聚回 shared pane block surface
