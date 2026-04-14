# 0156 Remove The Last Point Figure Secondary-Pane Suppression Branch

这刀的目的很简单：把 `P&F` 从 workbench 里最后一条“特殊对待”的 secondary-pane 压制分支删掉。

## 背景

之前的状态其实已经不一致了：

- `Renko` 有 API 级 compressed-main + secondary-pane 契约
- `Kagi` 也有
- `Line Break` 在上一刀已经把 lower panes 收回到引擎自己的 chart-context 路径
- 只剩 `P&F` 还在 workbench 里被 `suppressSecondaryPanes` 单独压掉

这会造成一个错误印象：

- 好像 `P&F` 还需要 demo 特判
- 但实际上 API 侧早就证明它能和 secondary panes 共存

## 这次改了什么

直接把 workbench 的这条逻辑删掉：

- `const suppressSecondaryPanes = mainChartType === "point-figure"`

改成：

- `const suppressSecondaryPanes = false`

因为到这个阶段：

- `P&F` lower panes 不该再被 workbench 单独屏蔽
- 如果它坏，应该让真实引擎路径暴露出来，而不是继续被 demo 藏住

## 结果

现在 workbench 里的这几类 synthetic main：

- `Renko`
- `Kagi`
- `Line Break`
- `Point Figure`

都会把 lower panes 挂回去，并统一依赖引擎自己的 chart-context secondary path。

换句话说，这条线终于从：

- “有些图型靠 demo 特判”

收成了：

- “这些 synthetic 主图在 workbench 都走同一类引擎路径”

## 验证

- `pnpm check`
- `pnpm test:unit`
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "point-figure" --update-snapshots`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "point-figure" --update-snapshots`

## 还没做

- 这不代表 synthetic-study policy 已经完全统一；目前只是 `Renko / Kagi / Line Break / P&F` 在现有 chart-context 路径上都不再需要 workbench suppression
- 更重的 `requested-context + merge` 仍然没有收进这条线
- default drawings 在 `P&F` / `Line Break` 这类 synthetic 主图上还没一起回到同等级语义
