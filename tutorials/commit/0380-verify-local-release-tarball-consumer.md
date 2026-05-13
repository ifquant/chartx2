# 0380 verify local release tarball consumer

## 背景

`pnpm release:local` 已经能生成本地 tarball，但只打包还不能证明 sibling app
真正能从发布边界安装和 import。这个切片补一个 chartx2 内部的消费端 smoke
check，避免后续公共 export 或 package subpath 变更只在 workspace 内通过。

## 主要目标

- 增加 `pnpm release:local:verify`
- 先重新执行本地 pack，确保验证的是当前工作树生成的 tarball
- 在 repo 外的临时目录创建最小 ESM consumer
- 安装 tarball、固定版本的 Svelte/Vite/TypeScript consumer 依赖后验证根导出与 focused subpath 导出
- 用 `tsc --noEmit` 检查 consumer 侧 types export 是否能解析
- 尽量在失败时也清理临时目录

## 改动概览

- 更新 [package.json](/Users/dev/workspace2/hc_apps/chartx2/package.json)
  - 增加 root script `release:local:verify`
- 新增 [scripts/verify-chartx2-local-release-consumer.mjs](/Users/dev/workspace2/hc_apps/chartx2/scripts/verify-chartx2-local-release-consumer.mjs)
  - 使用 OS temp 目录创建 repo 外 consumer
  - 先重新打包，再通过 `file:` 依赖安装最新 `chartx2-library-*.tgz`
  - 用 Vite SSR 形式的 ESM probe 检查 `ChartFrameShell` 和
    `WorkbenchDrawingInspectorPanel`
  - 用 TypeScript probe 检查 root export 和 focused subpath 的 `.d.ts` 解析
  - 在 `finally` 中删除临时 consumer
- 更新 [README.md](/Users/dev/workspace2/hc_apps/chartx2/README.md)
  - 在 local package release 流程里补充 verify 命令

## 关键知识

- 这个 smoke check 故意不在 workspace 内运行，目的是验证当前重新打出的 tarball
  export map，而不是验证源码路径或 pnpm workspace link。
- 依赖版本固定在当前 workspace 已验证的 Svelte/Vite/TypeScript 组合上，避免外部最新版本变动让这个检查漂移。
- 公共面包含 `.svelte` 组件 re-export，所以 probe 使用最小 Vite/Svelte consumer；
  纯 Node import 无法加载 `.svelte` 文件，不能代表真实 Svelte app 消费路径。
- 当前 probe 只检查稳定公共面：根 `@chartx2/library` 的 `ChartFrameShell`，以及
  `@chartx2/library/workbench-drawing-inspector` 的
  `WorkbenchDrawingInspectorPanel`。
- 如果这个检查失败，优先排查 package export、build output、tarball 是否刷新，而不是让
  sibling app 直接依赖源码绕过问题。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 release:local`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 release:local:verify`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 这次没有修改 package build 行为或发布产物生成逻辑
- 这次没有扩大 `@chartx2/library` 的 public API，只验证已有导出
