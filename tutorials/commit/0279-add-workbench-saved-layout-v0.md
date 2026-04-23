# 0279: 添加 Workbench Saved Layout V0

这次给 Workbench 增加了第一版本地布局保存能力。

上一笔 `0278` 已经让 watchlist symbol open 走 `WorkbenchHostAdapter`。如果继续做 TradingView-like workstation，下一步必须让用户能把当前 symbol 和 chart layout 保存下来，否则 workbench 仍然只是一次性 demo 状态。

## 1. 为什么要先做本地 provider

Saved layout 以后可能接账号、云同步、命名布局、导入导出，但这些都不应该提前进入 chart runtime。

所以这次只做最小但正确的边界：

- versioned layout state
- localStorage provider
- controller save / restore / reset
- Svelte shell 按钮转发

这样后续把 localStorage 换成私有后端 provider 时，不需要改 chart runtime，也不需要让页面 shell 直接拼 chart state。

## 2. 这次具体改了什么

- 新增 `src/lib/chartx/public/workbench-layout.ts`，定义 `WorkbenchLayoutStateV1`、结构 guard 和 localStorage provider。
- `mountWorkbenchDemo` 新增 `persistenceProvider` 注入。
- workbench controller 新增 `saveLayout`、`restoreLayout`、`resetLayout`。
- Workbench toolbar 新增 `Save layout`、`Restore layout`、`Reset layout` 按钮。
- Browser test 覆盖 SPX 保存、reset 回 NDX、restore 回 SPX。

## 3. reset 的语义

这次 `Reset layout` 不是“删除 saved layout”。

它的语义是：把当前 workbench view 重置回默认 `NDX` / `1D`。保存过的 layout 仍然留在 provider 里，所以用户可以执行：

- save SPX
- reset 当前视图到 NDX
- restore 回 SPX

这个语义更接近 workstation 里的“重置当前视图”，而不是“删除全部保存状态”。

如果以后要做删除布局，应该单独加 `Delete saved layout` 或 named-layout manager，不要把它混进 reset view。

## 4. 这次没有做什么

没有实现多 named layouts。

没有实现云同步。

没有实现导入导出文件。

没有实现多图 layout restore。

没有实现 indicator / drawing template manager。

## 验证

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-layout.test.ts tests/unit/workbench-contract.test.ts`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "saves and restores"`
- `pnpm build`

## 未包含

- cloud persistence
- named layout manager
- import/export
- multi-chart layout persistence
