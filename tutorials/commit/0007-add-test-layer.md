# 0007 补上 phase-one 的第一层测试

## 背景

前一刀已经把 `chartx2` 的最小浏览器 chart harness 跑起来了，但“能看到一张图”还不够。对于图表引擎来说，如果没有测试，后面继续迁 `lightweight-charts` 时很容易把 range、scale、data ingestion 或渲染基线悄悄改坏。

所以这一步的任务很明确：

- 给 `model core/scales/data` 补第一组 unit tests
- 给浏览器 harness 建第一张 visual baseline
- 把 phase-one checklist 和页面进度同步到真实状态

## 主要目标

把 phase-one 的测试层从“计划里要做”推进到“仓库里已经存在并可重复运行”。

## 改动概览

- 更新 [package.json](/Users/dev/workspace2/hc_apps/chartx2/package.json)，加入 `pnpm test`、`pnpm test:unit`、`pnpm test:visual`
- 新增 [vitest.config.ts](/Users/dev/workspace2/hc_apps/chartx2/vitest.config.ts)，把 unit tests 固定在 `tests/unit`
- 新增 [playwright.config.ts](/Users/dev/workspace2/hc_apps/chartx2/playwright.config.ts)，把 visual regression 固定在浏览器 harness，不直接绑 Tauri
- 新增 [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)，覆盖 visible range、time scale、price scale、空数据、单 bar、乱序数据和 price range
- 新增 [tests/visual/phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts) 和对应 snapshot，保存第一张 baseline candle 图
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)、[src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，把当前阶段的测试进度和页面状态同步起来

## 关键知识

为什么 visual baseline 先跑在浏览器 harness，而不是直接跑在 Tauri 里？因为第一阶段主要验证的是图表引擎本身，不是桌面壳环境。

浏览器 harness 更适合做第一张 baseline，原因是它更容易固定：

- 固定地址
- 固定 viewport
- 固定 DPR
- 固定 sample data

这样截图差异更容易说明“图真的变了”，而不是宿主环境抖了。

## 补充知识

- 图表项目里的视觉回归测试，不只是测样式，它本质上也在测 scale math 和 render pipeline 有没有悄悄偏掉。
- `pnpm exec vite dev --host ...` 比 `pnpm dev -- --host ...` 更适合给 Playwright 当 `webServer.command`，因为它更直接，挂起和参数转发问题更少。

## 验证

- `pnpm test:unit` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有 resize-sensitive visual snapshot
- 还没有 crosshair / pan / zoom 的测试
- 还没有 upstream parity contract tests
