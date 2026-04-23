# 0260: 把 downstream linked resize 扩到 fixed secondary-secondary divider

上一笔 `0259` 修掉的是一个 correctness 问题：

- primary divider 已经能代理 downstream resizable pane
- clamp 也已经改成按 controlled pane 的真实 span 算

但那之后，linked resize 还是只停在一个偏特例的边界：

- `primary / fixed-secondary` divider 可以代理下游 resizable pane
- 但 `fixed-secondary / fixed-secondary` divider 仍然会直接失效

这意味着 repo 已经有了一半的 linked-resize 语义，但还没把它扩成更一般的 fixed/fixed divider contract。

这次就是把那半步补齐。

## 1. 之前为什么还不够

在 `0258` 和 `0259` 之后，policy 还是默认：

- 相邻两侧有 resizable pane，直接选相邻
- 相邻两侧都 fixed，只有 `upperPane.kind === "primary"` 才会向下游扫描

所以这类结构仍然不工作：

- `primary`
- `pane-1` fixed
- `pane-2` fixed
- `pane-3` resizable

拖：

- `pane-1 / pane-2` 之间的 divider

旧逻辑会直接返回：

- `controlledPaneId = null`

或者就算硬塞一个 downstream controlled pane，clamp 仍然缺少一个关键事实：

- 这时真实可变的 opposing side 不是 `pane-1`
- 而是 `primary`

## 2. 这次具体补了什么

### A. `pane-model.ts`

`resolvePaneDivider(...)` 的 interactive 判定继续放宽：

- 只要当前 divider 之后还存在 resizable secondary pane
- 这条 divider 就允许进入 linked-resize 解析

这不再局限于：

- `upper.kind === "primary"`

而是允许：

- `fixed secondary / fixed secondary / ... / resizable secondary`

这样的 downstream 链。

### B. `chart-pane-layout-policy-owner.ts`

这里是这次真正的核心。

#### `resolveControlledPaneId(...)`

现在当相邻两侧都 fixed 时，会统一：

- 从 lower pane 开始向下扫描
- 选第一个 resizable secondary pane

不再把这个能力只限定给 primary divider。

#### `resolveControlledResizeHeight(...)`

这次又补了一个新的状态口径：

- `startPrimaryHeight`

因为一旦 divider 本身不在 primary 旁边，想把 downstream controlled pane 算对，就不能只知道：

- `startUpperHeight`
- `startLowerHeight`
- `startControlledHeight`

还必须知道：

- 当下真正能和 controlled pane 对消的 primary pane 起始高度是多少

所以 generalized downstream linked-resize 现在的 clamp 规则变成：

- 如果是 downstream controlled pane
  - total span 用 `startPrimaryHeight + startControlledHeight`
  - opposing minimum 用 `MIN_PRIMARY_HEIGHT`

而不是再把 fixed intermediary pane 错当成 opposing side。

### C. `chart-pointer-runtime.ts` / `chart-view-state.ts`

pointer-down 现在会把：

- `startPrimaryHeight`

一起写进 resize state。

这让 move-time policy 不必再猜 primary 当前是不是实际对侧。

## 3. 现在新支持的行为

这次新增的最小新能力是：

- `primary = 300`
- `pane-1 = 100` fixed
- `pane-2 = 90` fixed
- `pane-3 = 120` resizable

拖 `pane-1 / pane-2` 之间的 divider 时：

- divider 仍然可交互
- controlled pane 会解析成 `pane-3`
- pane-3 可以继续增长或收缩
- clamp 用的是 `primary + pane-3` 这组真实可变 span
- primary 仍保留最小高度约束

这就把 linked resize 从“primary 邻边特例”推进到了“更一般的 fixed/fixed downstream 代理”。

## 4. 为什么这一步值得单独提交

这不是纯测试补丁，也不是再拆一个 owner。

这一步真正推进的是 pane/layout 的行为边界：

- divider hit-test 更接近真实 linked-resize contract
- controlled target resolution 不再只会处理 primary 邻边 case
- resize state 已经开始显式承认 primary 是 generalized downstream resize 的真实 opposing side

也就是说，这条线现在已经从：

- “能支持一个 downstream 特例”

推进到：

- “开始形成更一般的 downstream linked-resize 语义”

## 5. 测试

这次补了三类回归：

- `pane-model.test.ts`
  - fixed secondary-secondary divider 在更下游有 resizable pane 时仍然 interactive
- `chart-pane-layout-policy-owner.test.ts`
  - fixed/fixed divider 能解析到第一个 downstream resizable pane
  - generalized downstream clamp 用 `primary + controlled` 的真实 span
- `chart-pane-runtime.test.ts`
  - fixed/fixed divider drag 会真正把 downstream resizable pane 改到新的高度

同时所有 resize-state 相关测试都补到了新的字段：

- `startPrimaryHeight`

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts tests/unit/pane-model.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有实现完整 multi-pane linked resize algorithm
- 还没有引入“向上游寻找 resizable pane”的对称规则
- 也没有开始 multi-layout ownership 或 pane block model 的更高层结构
