# 从 Workbench 面板创建价格提醒

## 背景

Alerts V0 已经有公开提醒状态和 demo controller 的 `createPriceAlert()` 能力，但 Svelte Workbench 面板里的 Alerts 卡片还只是静态展示。这个提交把卡片右上角的 `＋` 变成真正的创建入口，并用浏览器测试覆盖完整 UI 流程。

## 主要目标

- 让 `MarketWorkbenchPanel` 通过 prop 接收创建价格提醒的动作。
- 让 `src/routes/+page.svelte` 继续保持薄壳，只调用 demo controller 的公开方法。
- 用 Playwright 从用户视角验证 Alerts 卡片新增提醒和 Activity 记录。

## 改动概览

- 在 `MarketWorkbenchPanel.svelte` 增加 `onCreatePriceAlert` prop。
- 给 Alerts 卡片增加 `.alert-card` 作用域 class，并把 `＋` 按钮绑定到 `onCreatePriceAlert`。
- 在页面壳增加 `createWorkbenchPriceAlert()`，调用 `workbenchController.createPriceAlert?.()`，只有创建成功时才刷新 `workbenchActions`。
- 在 `phase-one-harness.spec.ts` 增加 `workbench creates a price alert`，测试只在 Workbench 的 `.alert-card` 内断言新提醒，避免和 watchlist / indicator 文案串扰。

## 关键知识

Svelte 组件如果要保持可复用，面板组件不应该直接知道 demo controller。这里使用 prop 把动作从页面传入，`MarketWorkbenchPanel` 只负责把按钮点击转发出去。

`src/routes/+page.svelte` 是 demo shell，不是提醒状态的 owner。它只做 host adapter：调用 `createPriceAlert?.()`，并在返回 `true` 后刷新动作投影。

## 补充知识

浏览器测试里的选择器要尽量贴近用户看见的区域边界。这里先定位 `[data-demo-tab="workbench"]`，再定位 `.alert-card`，最后点击 `Create price alert`，可以避免其他卡片里出现类似 `NDX` 或 `Price` 文案造成误判。

`aria-label="Create price alert"` 既让按钮更容易被测试稳定定位，也让只有 `＋` 图标的按钮对辅助技术更明确。

## 验证

- `pnpm check` PASS，`svelte-check` 报告 0 errors / 0 warnings。
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench creates a price alert"` PASS，1 passed。
- `git diff --check` PASS。

## 未覆盖项

- 没有修改 `src/lib/demo/chartx-demo.ts` 的提醒创建规则。
- 没有实现提醒编辑、删除、暂停、触发通知或跨会话 UI 管理。
- 没有把 toolbar 顶部的 `Alert` 按钮改成创建入口，本次只处理 Alerts 卡片的 `＋`。
