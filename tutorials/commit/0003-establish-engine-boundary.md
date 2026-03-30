# 0003 建立 phase-one 的仓库清理与 engine 边界

## 背景

在 `chartx2` 的计划被收窄之后，第一步不是直接搬 `lightweight-charts` 代码，而是先把仓库整理到一个不会误导后续迁移的状态。如果一开始就带着草稿文件、坏掉的旧入口和页面内直塞 chart 逻辑的倾向继续开发，后面每一步都会变脏。

这次改动就是 phase-one 的第一刀：

- 先做 repo hygiene
- 再把内部 `chartx` engine 边界立起来

## 主要目标

让后续 chart engine 迁移有一个清楚的起点：

- 工作区里不再留会误导人的旧草稿文件
- 宿主页面通过 `chartx` 的公共入口拿数据，而不是自己长出一堆未来要拆掉的内部逻辑

## 改动概览

- 更新 `.gitignore`，把 `.vscode/` 和 `.trae/` 这类本地工具目录排除在版本控制之外。
- 删除没有稳定价值的草稿或坏状态文件：`a`、`b`、`temp_page.html`、`chart-model.ts`。
- 新建 `src/lib/chartx/public/index.ts` 和 `src/lib/chartx/internal/foundation.ts`，把 `public -> internal` 边界落成第一版真实目录。
- 重写 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，让宿主页通过公共入口读取 phase-one foundation 数据，不再继续沿用模板的 `greet` 示例流。
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)，把已经完成的 hygiene 和 boundary 项目勾掉。

## 关键知识

这次的重点不是“功能”，而是“结构”。

很多项目死在第一步，不是因为做不出功能，而是因为第一批代码没有边界。最常见的坏味道是：

- 页面文件直接长出业务核心
- 宿主壳直接 import 内核实现
- 一些历史草稿文件没人敢删，于是后来的人不断猜它们是不是还有效

所以这次 public/internal 的目录虽然还很薄，但意义很大。它向后续所有迁移代码声明了一件事：

- host shell 只能看 public entrypoint
- engine internals 以后只能在 `src/lib/chartx/internal` 里长

## 补充知识

- “先把目录和依赖方向立住”不是过度设计。对这种引擎类项目来说，这是防止 page file 变成永久垃圾场的最低成本做法。
- 删除明显失效的草稿文件，本质上也是一种正确性工作。保留坏入口往往比完全没有入口更危险，因为它会诱导后来的人去兼容不存在的历史。

## 验证

- `pnpm check` (`PASS`, `svelte-check found 0 errors and 0 warnings`)
- `cargo check` (`PASS`)

## 未覆盖项

- 还没有开始迁移 `lightweight-charts` 的 `typings/helpers` 或 `model` 层
- 宿主页现在展示的是 phase-one foundation 信息，不是实际图表
- 还没有建立 visual regression harness、unit test 骨架或 upstream parity contract tests
