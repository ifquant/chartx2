# 0382 default local release output to build dir

## 背景

`chartx2` 的本地 release tarball 是构建产物，不应该长期放在 workspace root
的 `releases/` 目录里。默认发布到 `build/chartx2` 可以把它归类为可再生成产物，
同时仍然给 sibling app 一个稳定、明确的本地消费路径。

## 主要目标

- 把默认本地发布目录改成 `/Users/dev/workspace2/hc_apps/build/chartx2`
- 同步 pack、consumer verify、README、AGENTS 和本地 release 计划文档里的路径
- 保持 `pnpm release:local:check` 作为发布前唯一入口

## 改动概览

- 更新 [scripts/pack-chartx2-local-release.mjs](/Users/dev/workspace2/hc_apps/chartx2/scripts/pack-chartx2-local-release.mjs)
  - 默认 tarball 输出目录改为 workspace-level `build/chartx2`
- 更新 [scripts/verify-chartx2-local-release-consumer.mjs](/Users/dev/workspace2/hc_apps/chartx2/scripts/verify-chartx2-local-release-consumer.mjs)
  - consumer smoke test 改为安装新 build 目录下的 tarball
- 更新 [AGENTS.md](/Users/dev/workspace2/hc_apps/chartx2/AGENTS.md) 和 [README.md](/Users/dev/workspace2/hc_apps/chartx2/README.md)
  - 把本地发布与 sibling app 消费示例统一到 `build/chartx2`

## 关键知识

- `build/chartx2` 是本地可再生成产物目录，当前不作为源码提交。
- 如果 sibling app 需要更新图表库，应先在 `chartx2` 运行 `pnpm release:local:check`，
  再升级自己的 tarball 依赖和 lockfile。
- 旧的 `releases/chartx2` 目录不再是默认输出位置；如果本机残留旧 tarball，不代表当前
  release flow 仍在使用它。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 release:local:check`
- `rg -n "file:\\.\\./releases/chartx2|/Users/dev/workspace2/hc_apps/releases/chartx2" /Users/dev/workspace2/hc_apps/chartx2 --glob '!**/0382-default-local-release-output-to-build-dir.md'`

## 未覆盖项

- 这次没有删除本机可能残留的旧 `releases/chartx2` 目录
- 这次没有发布到 npm registry 或 GitHub Packages
