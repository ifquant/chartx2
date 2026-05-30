# 0389 write chartx2 status handoff

## 背景

用户准备清理当前会话并重新开新会话，需要把 `chartx2` 的当前状态、边界规则和已知认知写到仓库里，
避免后续 agent 只能依赖聊天上下文。

## 主要目标

- 新增 `status.md` 作为新会话入口文档
- 汇总当前 git 状态、最近主线提交和远程同步状态
- 固化 library-first、engine-first、alpha2 边界和本地 tarball release flow
- 记录下一步推荐工作和已知风险

## 改动概览

- 新增 [status.md](/Users/dev/workspace2/hc_apps/chartx2/status.md)
  - 记录当前分支、最新提交和最近主线能力
  - 整理 `packages/chartx2` 与 `examples/tauri-svelte` 的职责边界
  - 记录 `@chartx2/library` public package boundary 和 `alpha2` 消费规则
  - 记录本地 release 输出目录 `/Users/dev/workspace2/hc_apps/build/chartx2`
  - 给出下一批推荐切片和风险点

## 关键知识

- `status.md` 是当前快照，不替代 [AGENTS.md](/Users/dev/workspace2/hc_apps/chartx2/AGENTS.md)。
- `AGENTS.md` 仍然是协作规则和边界的源头；`status.md` 用于降低新会话恢复成本。
- 这次是文档 handoff，没有改变 package API、example app 或 release scripts。

## 验证

- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 没有重新运行 `pnpm check`、`pnpm test` 或 `pnpm release:local:check`
- 没有更新 `README.md` 或架构计划文档
