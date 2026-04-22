# 0254: 补全 secondary-secondary divider 的 resize 语义

`pane/layout` 这条线前几笔已经把边界拆清楚了：

- `chart-pane-layout-owner.ts`
  - 共享几何只读模型
- `chart-pane-layout-runtime-owner.ts`
  - pane layout 的运行时组合
- `chart-pane-layout-policy-owner.ts`
  - pane height normalization 和 resize clamp policy

但这时候还剩一个明确的行为缺口：

- secondary-secondary divider 只有“上面的 pane 可调”这一种语义

这会导致一种很奇怪的情况：

- 上面的 secondary pane `resizable: false`
- 下面的 secondary pane `resizable: true`
- 用户把鼠标移到它们之间的 divider

结果 divider 根本拿不到，或者即使拿到了，resize policy 也会错误地继续套用“给 primary 留最小高度”的那套 clamp。

这不是 owner 位置的问题，而是 resize contract 本身不完整。

## 1. 之前具体哪里不对

问题其实分成两层。

### A. divider hit-test 不完整

在 `pane-model.ts` 里，`resolvePaneDivider(...)` 之前的规则近似是：

- 如果 upper 是 primary，就看 lower 是否 resizable
- 否则就只看 upper 是否 resizable

这意味着：

- primary-secondary divider 可以
- secondary-secondary divider 只有 upper secondary 能决定是否可拖

所以“lower secondary 才是可调侧”的情况会直接丢掉 divider。

### B. clamp policy 也没区分 span 类型

即使让 divider 可交互了，`chart-pane-layout-policy-owner.ts` 之前还是统一用：

- `totalResizableSpan - MIN_PRIMARY_HEIGHT`

来算 controlled pane 的最大高度。

这只适用于：

- primary-secondary

因为这时候确实需要给 primary 保底。

但如果 divider 两侧都是 secondary，就不应该再给 primary 预留空间；它们之间的拖拽只需要保证：

- 另一侧 secondary pane 仍然不低于最小高度

否则就会出现测试里看到的错误：

- 本来应该能到 `80`
- 却被错压到 `72`

## 2. 这次改了什么

### A. `pane-model.ts`

`resolvePaneDivider(...)` 现在改成：

- 只要相邻两侧里任一侧 secondary pane 是 `resizable`
- 这个 divider 就应当被认为是可交互的

这样 secondary-secondary divider 不再只认 upper pane。

### B. `chart-pane-layout-policy-owner.ts`

`resolveControlledResizeHeight(...)` 现在也同步补全：

- 如果 upper secondary 可调，就继续由 upper 控制
- 否则如果 lower secondary 可调，就改由 lower 控制

同时 clamp 规则也分成两类：

1. primary-secondary
   - 仍然给 primary 保最小高度
2. secondary-secondary
   - 不再拿 `MIN_PRIMARY_HEIGHT` 参与 clamp
   - 只要求另一侧 secondary 至少保留最小高度

这才是和 divider 真实 domain 对齐的语义。

## 3. 为什么这一步值得单独一笔

这次不是“再抽一个 helper”。

它真正补的是 pane/layout 行为 contract：

- 哪些 divider 应该可拖
- 谁在拖拽时是 controlled pane
- clamp 应该按哪种 span 语义算

如果这一步不单独收掉，后面继续往 multi-layout 或 richer resize rule 推进时，就会一直带着一个已经歪掉的基础 contract。

## 4. 测试

这次补的测试都是围着 secondary-secondary divider：

- `tests/unit/pane-model.test.ts`
  - 锁住“任一相邻 secondary pane 可调时 divider 仍可命中”
- `tests/unit/chart-pane-layout-owner.test.ts`
  - 锁住 layout owner 暴露同样的 divider 语义
- `tests/unit/chart-pane-layout-policy-owner.test.ts`
  - 锁住 lower secondary 控制 divider 的 policy
- `tests/unit/chart-pane-runtime.test.ts`
  - 锁住实际 drag resize 会作用到 lower secondary，而不是错误地丢掉或错 clamp

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/pane-model.test.ts tests/unit/chart-pane-layout-owner.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有改 pane frame layout 比例分配算法
- 没有改更复杂的 multi-pane linked resize 行为
- 没有开始 multi-layout / host-level layout ownership
