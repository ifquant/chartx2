# 0381 add local release check gate

## 背景

`chartx2` 已经有本地打包和 tarball consumer 验证，但 release 前的本地检查还分散在
多个命令里。这个切片增加一个 root gate，让后续准备本地发布时有单一入口，减少漏跑
类型检查、单元测试或 package boundary smoke check 的风险。

## 主要目标

- 增加 `pnpm release:local:check`
- 按固定顺序运行 `pnpm check`、`pnpm test:unit`、`pnpm release:local:verify`
- 用 Node `execFileSync` 顺序执行，避免 shell chaining 隐含行为
- 在 [AGENTS.md](/Users/dev/workspace2/hc_apps/chartx2/AGENTS.md) 里把它记录为 pre-release gate

## 改动概览

- 更新 [package.json](/Users/dev/workspace2/hc_apps/chartx2/package.json)
  - 增加 root script `release:local:check`
- 新增 [scripts/check-chartx2-local-release.mjs](/Users/dev/workspace2/hc_apps/chartx2/scripts/check-chartx2-local-release.mjs)
  - 从 repo root 顺序调用 `pnpm check`
  - 然后调用 `pnpm test:unit`
  - 最后调用 `pnpm release:local:verify`
- 更新 [AGENTS.md](/Users/dev/workspace2/hc_apps/chartx2/AGENTS.md)
  - 在 local release flow 中说明 `release:local:check` 是 canonical pre-release gate
  - 在常用命令与 package release boundary 中补充该检查入口

## 关键知识

- 这个 gate 不直接内联各个子检查逻辑，只负责用确定顺序组合现有命令。
- `release:local:verify` 自身会重新执行 local pack，并在 repo 外临时 consumer 中安装
  tarball，所以整个 gate 的最后一步仍然覆盖真实 package 消费边界。
- 如果 gate 失败，应优先修复失败的子命令，而不是绕过 gate 直接给 sibling app 使用源码
  link。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 release:local:check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 这次没有修改 package build、pack 或 tarball consumer probe 的内部行为
- 这次没有触碰 `alpha2` 或任何 sibling app
