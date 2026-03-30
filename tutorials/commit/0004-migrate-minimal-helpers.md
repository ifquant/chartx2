# 0004 迁移最小 typings/helpers 子集

## 背景

`chartx2` 的 phase-one 路线已经明确，不做整包盲抄，而是按 `lightweight-charts` 的依赖顺序分层迁移。那第一层最合理的切法，不是直接碰 `model` 或 `renderers`，而是先把后面几层最容易复用的底层 `helpers` 和类型工具带进来。

如果这一步做得太大，就会把 `browser`、`canvas`、事件系统和一堆暂时用不到的工具一起拖进仓库。那样不是加速，是提前制造复杂度。

## 主要目标

只迁移后续 `model/core/scales/data` 最可能立刻依赖的一小组 `typings/helpers`，并保持它们在 `chartx` 的 internal boundary 里面，不泄露到 host shell。

## 改动概览

- 在 `src/lib/chartx/internal/helpers/` 下加入最小 helper 子集：
  - `assertions`
  - `delegate`
  - `idestroyable`
  - `isubscription`
  - `mutable`
  - `nominal`
  - `strict-type-checks`
- 增加 `src/lib/chartx/internal/helpers/index.ts` 统一内部导出。
- 增加 `src/lib/chartx/internal/typings/index.ts` 作为后续内部类型入口。
- 更新 [src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts)，把当前活动步骤从抽象的“Parity Definition”调整为实际进行中的 “Typings And Helpers”。
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)，记录这批 helper 已经迁入，并把本阶段的 compile exit criterion 勾掉。

## 关键知识

为什么这一步值得单独做？因为图表引擎不是普通组件库。后面的 `model`、`scale math`、`visible range`、`delegate event` 都会反复依赖一些很底层的小工具。如果这些工具还没落地，你后面每迁一层都得顺手发明自己的版本，结果就是：

- 名字越来越像 upstream
- 语义却越来越偏
- 最后你以为自己在“迁移”，其实是在“边抄边重写”

所以先把这个最小 helper 闭包立住，后面才能更诚实地做 parity work。

## 补充知识

- “最小可用闭包”比“看起来完整的一层”更重要。对 phase-one 来说，能被下一层立刻消费，比目录看起来漂亮更值钱。
- `Delegate` 这类 helper 虽然现在还没被 host page 使用，但它很可能是后续 model 事件通知最早会用到的基础件。先迁它，比未来再造一个 event helper 更稳。

## 验证

- `pnpm check` (`PASS`, `svelte-check found 0 errors and 0 warnings`)
- `cargo check` (`PASS`)

## 未覆盖项

- 还没有开始迁移 `model core/scales/data`
- 还没有建立任何 unit test 或 visual regression harness
- 这批 helper 还没有被真实 chart model 使用，当前只完成了 internal boundary 内的落位
