# 0379 prepare chartx2 for local package release

## 背景

`chartx2` 已经是 library-first workspace，但如果文档只讲源码结构，不讲 sibling app
应该怎么消费它，新人还是很容易退回到“直接连 source link”的旧习惯。

这次切片只补文档规则，不改打包脚本。重点是把默认工作流说清楚：`chartx2`
应该先本地发包，再让 sibling app 消费 tarball。

## 主要目标

- 说明本地发布命令是 `pnpm release:local`
- 说明 tarball 输出目录是 `/Users/dev/workspace2/hc_apps/build/chartx2/`
- 说明 sibling app 默认应消费 `file:../build/chartx2/*.tgz`
- 说明 source link 只适合短期调试，不适合作为长期 committed 依赖

## 改动概览

- 更新 [README.md](/Users/dev/workspace2/hc_apps/chartx2/README.md)
  - 增加本地 release tarball 的消费说明
  - 明确给出 `file:../build/chartx2/chartx2-library-0.1.0.tgz` 这种依赖形态示例
- 更新 [AGENTS.md](/Users/dev/workspace2/hc_apps/chartx2/AGENTS.md)
  - 把 `pnpm release:local` 和 release 目录写成协作规则
  - 明确 sibling app 应优先消费 released package
  - 明确 `examples/tauri-svelte` 和 `@chartx2/library/internal` 不是 sibling app 的稳定消费面

## 关键知识

- library-first 仓库不等于所有 sibling app 都该直接连源码；真正稳定的边界是发布后的 package surface
- 如果某个 sibling app 缺少能力，正确动作通常是补 `@chartx2/library` 的 public export，然后重新发本地包
- `@chartx2/library/internal` 可以服务 example 和测试，但不应该成为跨仓公共 API

## 补充知识

- 写文档时，最重要的是把“默认流程”写成规则。脚本存在不代表团队真的会按同一条路径协作。
- 本地 tarball 流程的价值不只是安装方便，它还能帮助团队区分“工作树里的实现细节”和“已经承诺给消费者的边界”。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 release:local`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check -- README.md AGENTS.md tutorials/commit/0379-prepare-chartx2-for-local-package-release.md`

## 未覆盖项

- 这次没有修改 `pnpm release:local` 脚本或任何 package/build 代码
- 这次没有定义远端包仓库发布流程；这里只先固定本地 release tarball 工作流
