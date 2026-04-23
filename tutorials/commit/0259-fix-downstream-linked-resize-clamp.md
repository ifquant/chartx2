# 0259: 修正 downstream linked resize 的 clamp 口径

上一笔 `0258` 已经让 primary divider 可以控制下游的 resizable secondary pane 了，但那一刀还留了一个 correctness 缺口：

- `controlledPaneId` 已经可以是 downstream pane
- `startControlledHeight` 也已经单独记录了
- 但 clamp 还在拿 divider 相邻两侧的 span 算最大高度

这意味着：

- 行为上看起来“已经支持 linked resize”
- 但只要 controlled pane 不是紧邻 lower pane
- 最大可增长高度就会被算小

这不是下一阶段优化，而是当前语义里真实存在的上限错误。

## 1. 问题具体出在哪里

之前 `chart-pane-layout-policy-owner.ts` 里的 `resolveControlledResizeHeight(...)` 是这样想的：

- `requestedHeight`
  - 已经改成基于 `startControlledHeight`
- 但 `maxControlled`
  - 还是基于 `startUpperHeight + startLowerHeight`

这里的 `startLowerHeight` 是 divider 紧邻 lower pane 的高度，不一定是被实际控制的 pane。

举一个已经支持的结构：

- `primary = 220`
- `pane-1 = 100` fixed
- `pane-2 = 120` resizable

拖的是：

- `primary / pane-1` 之间的 divider

真正被控制的是：

- `pane-2`

这时旧公式的最大高度会是：

- `220 + 100 - 160 = 160`

但真实可用的 span 应该是：

- `220 + 120 - 160 = 180`

也就是：

- clamp 错把 fixed intermediary pane 当成了受控 pane 的可变空间

## 2. 这次怎么修

修法没有再加新状态，而是直接改口径：

- 如果 controlled pane 在 divider 上侧
  - 用 `startControlledHeight + startLowerHeight`
- 如果 controlled pane 在 divider 下侧
  - 用 `startUpperHeight + startControlledHeight`

也就是说，真正参与 max clamp 的永远是：

- controlled pane
- divider 另一侧

而不是：

- divider 的相邻上/下两侧

## 3. 为什么这才是正确边界

linked resize 已经承认了一件事：

- divider 相邻 lower pane 不一定是控制对象

那 clamp 也必须承认同一件事。

否则系统会出现一种很糟的“半支持”状态：

- hit-test 能命中
- pointer-down 能锁定 controlled target
- move-time 也会更新那个 target
- 但最终尺寸上限还是假的

这会让交互看起来像“还能再拖，但总比预期早停”。

## 4. 这次新增的回归测试

### `chart-pane-layout-policy-owner.test.ts`

新增一条明确锁这个 bug 的测试：

- `primary = 220`
- `pane-1 = 100` fixed
- `pane-2 = 120` resizable
- 拖 primary divider 向上
- 期望 `pane-2` 最终能被 clamp 到 `180`

### `chart-pane-runtime.test.ts`

同样补了 runtime 级别的回归：

- 直接跑 `applyPaneResize(...)`
- 验证最终写回的 `preferredHeight` 是 `180`
- `pane-1` 仍保持不变

## 5. 顺手修掉的旧测试问题

这次还顺手修正了一条旧断言：

- 一个 `secondary-primary` case 之前期望最大高度是 `180`
- 但按 `primary` 最小高度 `160` 的规则，真实上限应当是 `160`

这条不是新回归，而是旧测试把 primary 保底算错了。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts tests/unit/pane-model.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有引入完整 multi-pane linked resize algorithm
- 没有处理多个 downstream resizable pane 之间的分配策略
- 没有改 multi-layout ownership 或 pane collection 的更高层结构
