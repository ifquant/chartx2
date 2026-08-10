# 0406：记录强化门禁后的 clean-main 发布回执

## 背景

`0405` 把 staged tgz 的 root/public barrel 自检、缺失导出反例和失败清理加入 canonical
release gate。因为这些脚本本身不进入 `@chartx2/library` 包，artifact bytes 可以与 `0404` 相同；
仍需在 `0405` 已提交并推送后的 clean main 上重新执行门禁，证明最终发布方法和源码 HEAD 对齐。

## 最终 clean-main 身份

| 项目 | 精确值 |
| --- | --- |
| ChartX2 HEAD | `5dce0e24e44a55b5abce9d673167d5a0e7176c7b` |
| branch / upstream | `main` / `origin/main` |
| package | `@chartx2/library@0.1.0` |
| artifact | `/Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz` |
| size | `239608` bytes |
| SHA-256 | `4373d4ef48603d0d9ebd3e60e4d6d8a402a888d81c779294bbfdc0168f2214a1` |
| SHA-512 | `54f81754f78e4ad8f3d6edb332e063d8c93d0411c1be0dc5d6f95991f1f33ff0833476ea2efee1d4b96aa25f0cdaf51a77fa2b81c9d229da2ddfa3ecaada9c31` |
| pnpm SRI | `sha512-VPgXVPeOStjz1u2zMuBj2Mk9BBHBvg3F1vlZkfHzP/CDNHbqLv7h1Llqol8M2vUad/orgcnSKdot36PsqtqcMQ==` |

artifact identity 与 `0404` 相同是预期结果：`0405` 改的是仓库 release verifier，而不是包内
public/runtime 文件。后续消费者必须同时核对这份 digest 与实际安装后的 root barrel；不能只凭同名
`file:` 路径或 pnpm virtual-store 中已有目录判断已升级。

## Canonical gate

在上表 clean main 上执行：

```bash
pnpm release:local:check
```

结果：PASS。

- library 与 example 的 `svelte-check` 均为 `0 errors and 0 warnings`；
- library 单测 `165` files / `591` tests，example 单测 `4` files / `16` tests；
- 隔离 failure test 覆盖 build failure 与实际删除 lifecycle declaration export 的 staged-tar
  mutation，均保留旧 artifact 且留下零 `.pack-*`；
- staged tar 自检确认 root/public declaration 与 runtime barrel 暴露 lifecycle 和 surface；
- workspace 外 consumer 从 tgz 根入口完成 named lifecycle type probe 与真实 Svelte/Chromium surface
  probe，终行是 `Verified chartx2 packed browser consumer`。

直接读取最终 tar 的 `package/dist/public/index.d.ts`，前几行包含：

```ts
export * from "./market-chart-lifecycle";
export * from "./market-chart-surface";
```

这份 payload 证据是 Alpha2 dependency adoption 的输入。Alpha2 仍必须刷新并验证自己的实际
`node_modules/@chartx2/library`，让 installed root declarations/runtime 与本 tar 一致，并让 lockfile
integrity 等于上表 SRI。

## 边界

本回执证明 clean-main ChartX2 package 与强化后的本地发布门禁，不证明 Alpha2 已安装成功、真实
DataX2 已接入、CTA 报告联动已完成，也不证明可见 native Tauri。ChartX2 继续拥有图表渲染和
chart-adjacent public seam；Alpha2 只消费 package root 并编排业务事实。
