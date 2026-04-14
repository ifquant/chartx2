# 0155 Route Line Break Lower Panes Through Engine Chart-Context Secondary Path

上一刀虽然把 `Line Break` 的 lower panes 恢复了，但方式还是 workbench 自己先构造 synthetic `lineBreakRows`，再从那份 rows 派生 volume/study 数据。那样能用，但它证明的是 “demo 会自己算”，不是 “引擎已经支持 synthetic chart-context secondary panes”。

这次把路径收回来了：

- workbench 重新给 `Line Break` 的 lower panes 喂原始 volume/line 数据
- 真正的对齐交给 `chart-harness` 现有的 `chart-context` secondary merge 路径

也就是：

1. main series 仍然先切到 `line-break`
2. chart context 绑定 compressed synthetic bar sequence
3. secondary `series` 因为还是 `chart-context`
4. 在 price-based main 下，通过引擎自己的 merge/display path 对齐到当前 synthetic axis

## 为什么这一步比上一刀更重要

因为这才是“把 synthetic chart-context 变成引擎能力”：

- 不是 demo 自己喂对的数据
- 而是任意通过 public API 加进去的 secondary series，只要是 `chart-context`，在 `Line Break` 下都应该沿当前 synthetic sequence 对齐

为此我补了一条 API 级视觉契约：

- 创建 `Line Break` 主图
- 再挂 volume pane + line pane
- 喂的仍然是原始 bars/volume/line
- 最后断言主图和 lower panes 在同一张截图里都可见且不被拉坏

## 结果

现在 `Line Break` 的 workbench lower panes 不再依赖 demo 自己先算 synthetic volume/study。

如果这条路径再坏：

- workbench 会坏
- API alignment 测试也会一起坏

这比单独修 demo 更能说明问题。

## 验证

- `pnpm check`
- `pnpm test:unit`
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "line-break" --update-snapshots`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "line-break" --update-snapshots`

## 还没做

- 这条能力目前只明确收稳了 `Line Break`
- `P&F / Kagi / Renko` 还没有统一成同等级 synthetic-study policy
- 这还不是 `requested-context + merge` 那条更重的多上下文能力
