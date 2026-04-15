# 0167 - 把 Study Merge 提升成模型层引擎

## 背景

非时间主图已经可以让副图跟随 synthetic chart context，也可以让 moving-average / compare 从 requested context 合并回当前横轴。此前这条路径主要靠 `mergeStudyDataToChartContext()` 辅助函数支撑，能工作，但边界还不够清楚：后续如果要扩展 `gaps`、标准行情源、跨周期源或更多 study，就会继续把语义堆在 harness 里。

这次把它收成 `StudyMergeEngine`，目的是先明确一个事实：study 的输入可以来自不同 context，但显示必须合并回当前 chart 的单一 bar sequence。

## 改动

- 新增 `StudyMergeEngine` / `StudyMergeRequest` / `createStudyMergeEngine()`，把 `carry-forward` 和 `exact` 合并策略放进模型层引擎。
- 保留 `mergeStudyDataToChartContext()` 兼容入口，但它现在只是代理到默认引擎。
- `chart-harness` 持有默认 study merge engine，并让 chart-context secondary、requested-context compare、requested-context moving-average 都通过引擎合并。
- 单元测试增加直接覆盖 engine 边界的 deterministic contract。
- checklist 更新为“MergeEngine 已有第一版”，同时明确 `gaps` 和 source-context registry 仍是后续工作。

## 验证

- `pnpm check`
- `pnpm test:unit`
- targeted Playwright requested-context merge flow

## 还没做

- `gaps` 目前仍等价于 `exact`，还没有 whitespace-aware 的显示策略。
- source context 的获取、缓存、标准行情源选择还没有独立 registry。
- 这次不改主图渲染效果，只收 study merge 的架构边界。
