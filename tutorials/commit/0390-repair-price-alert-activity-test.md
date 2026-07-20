# 修复价格提醒的 Activity 验证

## 背景

工作台的 Activity log 已经从旧的 `.action-card` 迁移到统一 bottom-panel，
但价格提醒 Playwright 用例仍然查找旧容器。提醒创建和持久化本身成功，测试却
因为不存在的 selector 超时。

## 主要目标

让价格提醒测试通过当前 bottom-panel owner 验证真实 Activity log，而不是删除
日志断言或恢复已淘汰的 UI 卡片。

## 改动概览

- 创建价格提醒后切换到 `logs` bottom tab；
- 在 `[data-bottom-panel-kind="logs"] [data-activity-log-panel]` 中验证事件；
- 保留提醒内容、armed 状态和 reload 后持久化断言。

## 关键知识

测试 selector 应跟随组件 ownership。`ActivityLogPanel` 已由 bottom-panel 负责，
测试继续依赖 `.action-card` 会把旧布局误当成产品契约。

## 补充知识

修复 stale test 时，不应简单删掉失败断言。先确认业务事件仍然产生，再把断言
移动到当前投影该事件的组件上，才能保留原来的行为覆盖。

## 验证

```bash
pnpm --filter @chartx2/example-tauri-svelte exec playwright test \
  tests/visual/phase-one-harness.spec.ts \
  --grep 'workbench creates a price alert'
```

## 未覆盖项

- 不修改提醒创建、持久化或 event log 生产逻辑；
- 不恢复旧 `.action-card`；
- 不涉及本轮 market-chart-surface 功能和视觉基线更新。
