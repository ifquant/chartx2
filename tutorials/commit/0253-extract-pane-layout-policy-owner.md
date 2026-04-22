# 0253: 把 pane height policy 收成 shared pane-layout policy owner

上一笔 `0252` 已经把 pane layout 的运行时组合从 `chart-pane-owner.ts` 里收到了：

- `getPaneHeight`
- `getPaneOptions`
- `applyPaneOptions`
- `setPaneHeight`
- `applyPaneResize`

但那一步之后，真正的 pane height policy 还没有被单独收出来。

它仍然散在两条路径里：

- `chart-pane-runtime.ts`
  - 直接决定拖拽 resize 时谁是 controlled pane
  - 直接写最小高度和 primary 保底 clamp
  - 直接决定最后怎样 normalize `preferredHeight`
- `chart-state-runtime.ts`
  - restore secondary pane state 时自己直接调 `normalizePaneHeight(...)`

这就意味着：

- pane runtime 和 pane-state restore 其实还没有共享同一层 policy boundary

## 1. 这次为什么先收 policy，而不是直接改规则

这一步依然不是改 pane 规则本身。

如果直接开始改：

- preferred-height normalization
- richer resize semantics
- multi-layout ownership

那会把“规则变化”和“边界收敛”混成一笔，后面很难判断问题到底是来自 policy 改写，还是只是 owner 拆分。

所以这次只做更稳的一步：

- 先把 pane height policy 明确提成一个共享 owner

先让 runtime 和 restore 走同一层 policy，再决定以后要不要改这层 policy 本身。

## 2. 新增了什么

新增：

- `src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts`

这个 owner 现在只承接两类策略：

- `normalizePreferredHeight(...)`
- `resolveControlledResizeHeight(...)`

具体职责是：

- 统一 secondary pane height 的归一化
- 统一 divider drag resize 时的 controlled pane 选择
- 统一 primary 保底高度和 secondary 最小高度 clamp

也就是说，这次收的是“pane height policy 是什么”，而不是“pane layout runtime 怎么调用它”。

## 3. 哪些路径改成走这层 policy

### A. `chart-pane-runtime.ts`

之前这里自己直接：

- 持有 `MIN_PRIMARY_HEIGHT`
- 持有 `MIN_CONTROLLED_HEIGHT`
- 算 `delta`
- 算 controlled pane
- 算 `requestedHeight`
- 算 clamp 后的高度
- 再调 `normalizePaneHeight(...)`

现在改成：

- `setPaneHeight(...)` 走 `paneLayoutPolicyOwner.normalizePreferredHeight(...)`
- `applyPaneResize(...)` 走 `paneLayoutPolicyOwner.resolveControlledResizeHeight(...)`

这样 runtime 这层更像“执行 layout mutation”，而不是自己定义 policy。

### B. `chart-state-runtime.ts`

之前 restore secondary pane state 时直接：

- `normalizePaneHeight(paneState.height ?? undefined)`

现在改成：

- `paneLayoutPolicyOwner.normalizePreferredHeight(...)`

这样 restore 路径和 runtime 路径终于开始共用同一层 pane height policy 了。

## 4. 这一步真正收紧了什么边界

到这一步，`pane/layout model ownership` 这条线已经不是只在拆 glue，而是开始明确三层边界：

1. `chart-pane-layout-owner.ts`
   - 共享几何只读模型
2. `chart-pane-layout-runtime-owner.ts`
   - pane layout 的运行时组合
3. `chart-pane-layout-policy-owner.ts`
   - pane height normalization 和 resize clamp policy

这三层分开后，后面如果要继续改 pane behavior，可以更清楚地区分：

- 是几何读模型的问题
- 是 runtime wiring 的问题
- 还是 policy 本身要变

## 5. 测试

新增：

- `tests/unit/chart-pane-layout-policy-owner.test.ts`

它锁住：

- preferred height normalization
- primary-secondary divider 的 controlled resize height
- resize clamp 和 non-resizable divider guard

同时补跑了直接依赖这层 policy 的旧测试：

- `tests/unit/chart-pane-runtime.test.ts`
- `tests/unit/chart-state-runtime.test.ts`

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-state-runtime.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有改 pane frame layout 算法
- 没有引入 richer multi-pane resize semantics
- 没有开始 multi-layout / host-level layout ownership
