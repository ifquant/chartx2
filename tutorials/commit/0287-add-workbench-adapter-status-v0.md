# 添加 Workbench Adapter Status V0

## 背景

前一轮 `0286` 已经把 workspace focus、layout import/export 和 status notice 接进了 workbench，但还有一个明显问题：当本地 storage provider 不可用时，用户只能从失败日志里猜发生了什么。

这不够像一个真正的 workstation。

如果 save / restore 按钮还摆在那，点击之后才在 activity log 里看到：

- `persistence provider unavailable`

那这条路径对用户来说依然是隐式失败。

所以这轮 0287 做的事很明确：把 adapter/provider 状态也变成 shell 里可见的、可测试的工作台状态。

## 为什么要做 adapter status，而不是只保留 status notice

`statusNotice` 适合表达一次动作的结果，比如：

- imported layout
- failed to export layout
- created alert

但它不适合表达“当前系统就缺一个能力”这种持续状态。

比如：

- layout persistence provider 根本没挂上
- alerts persistence provider 根本没挂上

这些不是一次动作结果，而是工作台的长期条件。如果只靠 transient notice：

- 用户可能根本没触发过对应按钮
- notice 很容易被后续成功提示覆盖
- shell 没有稳定位置告诉你当前 workstation 是完整还是降级

所以这次把 adapter status 单独做成一组 persistent rows：

- `Market data`
- `Layout persistence`
- `Alerts persistence`

它和 status notice 分工不同：

- status notice 说“刚才发生了什么”
- adapter status 说“当前系统拥有什么能力”

## 这次为什么顺手把按钮 disable 也一起做了

如果 adapter status 只是展示，按钮却仍然保持可点，那么用户仍然要走一遍失败路径。

这会产生一种很差的体验：UI 明明知道 provider 缺失，却还要等用户点一下再失败。

所以这轮顺手把 toolbar 上相关动作也和 adapter state 对齐：

- `Save layout` / `Restore layout` 在 layout persistence 缺失时直接 disabled
- `Reset layout` 仍然可用，因为它不依赖 persistence provider

这个判断没有再去反推 command palette 状态，而是直接依据实际的 workstation state 来决定。这样语义更清楚，也避免了 UI 依赖命令面板时序。

## page shell 和 controller 的边界这次怎么守住

这轮还顺手修了一个容易被忽略的边界点：`window.localStorage` 本身可能在浏览器环境里获取失败。

以前如果直接在 `+page.svelte` 的 `onMount` 里拿它，一旦 getter 抛错，整个 workbench shell 都可能在初始化阶段崩掉。

这次的处理是：

- `+page.svelte` 只负责尝试获取 storage
- 如果失败，就把 provider 传成 `undefined`
- controller 再把这种降级状态转换成 adapter status + status notice

这样页面层仍然只是薄壳，不自己决定“缺 provider 后业务该怎么表现”。

## 这次实际达成了什么

现在 workbench 在缺少本地 storage provider 时，会有一条完整而明确的表现链：

1. 页面层安全地降级为 `undefined` provider。
2. controller 发布 `adapterStatus`。
3. shell 渲染 `Adapters` 卡片。
4. `Save layout` / `Restore layout` 直接 disabled。
5. warning notice 明确提示当前 local layout save/restore 不可用。
6. 浏览器测试可以稳定复现和断言这个降级模式。

这比“点一下按钮再失败”要清楚得多，也更接近一个真实 workstation 的行为。

## 这次没有做什么

这轮故意没有继续扩成更大的 adapter system：

- 没有做 remote adapter health
- 没有做 reconnect / retry
- 没有做更复杂的 degraded state 恢复流程
- 没有为每一个 panel 都补完整 missing-data empty state

这次只收最直接、最影响工作台可理解性的那条线：provider 缺失时，UI 必须显式说清楚。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-contract.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "adapter status|command palette|saves and restores"`

## 未覆盖项

- 这次只补了 provider/adapters 的 persistent shell state，没有继续铺开所有 panel 的 missing-data empty states。
- 也没有引入 remote health 或 reconnect policy；这仍然属于下一层适配能力。
