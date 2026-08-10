# 0404：记录 clean-main Market 生命周期发布回执

## 背景

`0403` 已实现 Market Chart 的生命周期回执与时间定位公开 seam。Alpha2 不能仅凭源码
HEAD、同名 tgz 路径或 workspace source link 判断自己接入了这个 seam：它需要一份能把已审查
源码、canonical package gate 和实际打包文件关联起来的 release receipt。

本提交只新增这份回执教程。执行发布门禁时，chartx2 工作树先确认为空，且
`HEAD = main = origin/main`；没有变更 package 版本、源码、public export、lockfile 或 release
脚本。

## 本次发布身份

| 项目 | 精确值 |
| --- | --- |
| source HEAD | `18cd019f8f3a09b1b1adc78c4cd9d5f15f7b538e` |
| branch / upstream | `main` / `origin/main` |
| ancestry | `HEAD...origin/main = 0 0` |
| package | `@chartx2/library@0.1.0` |
| artifact | `/Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz` |
| size | `239608` bytes |
| SHA-256 | `4373d4ef48603d0d9ebd3e60e4d6d8a402a888d81c779294bbfdc0168f2214a1` |
| SHA-512 | `54f81754f78e4ad8f3d6edb332e063d8c93d0411c1be0dc5d6f95991f1f33ff0833476ea2efee1d4b96aa25f0cdaf51a77fa2b81c9d229da2ddfa3ecaada9c31` |
| pnpm SRI | `sha512-VPgXVPeOStjz1u2zMuBj2Mk9BBHBvg3F1vlZkfHzP/CDNHbqLv7h1Llqol8M2vUad/orgcnSKdot36PsqtqcMQ==` |

SHA-512 hex 与 SRI 是同一 digest 的两种表达。消费者必须让自己实际安装的 artifact 和 lockfile
integrity 对上这份回执；文件名或 `file:` 路径相同不能证明包内容相同。

## 公开 root seam 与 packed runtime 证明

`packages/chartx2/package.json` 仍只发布 `dist`，root export 的 `types`、`svelte`、`default`
均指向 `./dist/index.d.ts` / `./dist/index.js`。source root barrel 经
`src/lib/public/index.ts` 重导出 `market-chart-lifecycle` 和 `market-chart-surface`；新 tgz 内也有
相应的 `package/dist/index.*`、`package/dist/public/market-chart-lifecycle.*` 与
`package/dist/public/market-chart-surface.*`。

canonical `release:local:verify` 不依赖 chartx2 workspace link：它在 workspace 外创建临时 consumer，
从上述 tgz 安装 `@chartx2/library`，再从 package root 对
`PhaseOneMarketChartSurface`、`PhaseOneMarketChartMountLifecycleReceiptV1`、
`PhaseOneMarketChartTimeFocusCommandV1` 与 `PhaseOneMarketChartTimeFocusCompletionV1` 做正、负类型
probe，并以 Playwright 挂载并驱动 lifecycle receipt → command → completion、callback 重入、
remount 去重以及 data identity 轮换。这样证明的是已打包 root public type/runtime surface，而不是
未打包 source 恰好可运行。

## Canonical gate

在上述 clean main 上执行：

```bash
pnpm release:local:check
```

结果：PASS。该命令严格依序运行 `pnpm check`、`pnpm test:unit` 与
`pnpm release:local:verify`：

- library 与 example 的 `svelte-check` 均为 `0 errors and 0 warnings`；
- library 单测为 `165` files / `591` tests passed；example 单测为 `4` files / `16` tests passed；
- release verify 重新 build、pack，并在 workspace 外 consumer 完成 TypeScript root-import probe 与
  Playwright packed-browser probe，输出 `Verified chartx2 packed browser consumer`。

为便于独立复核 artifact，可执行：

```bash
artifact=/Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
wc -c < "$artifact"
shasum -a 256 "$artifact"
shasum -a 512 "$artifact"
openssl dgst -sha512 -binary "$artifact" | openssl base64 -A
```

## 清理与后续边界

release script 的 staging `.pack-*` 在成功后会删除；最终 release 目录只留下上表 tgz。
library 的 `dist/` 是 gitignored generated output；本回执写入前后仓库没有 source/package 变更，
并执行 `git diff --check` 通过。

这份证据允许 Alpha2 进入**依赖更新与实际安装验证**：它的 dependency 必须精确指向上表 tgz，普通
install 后 lockfile SRI 必须匹配，且从 Alpha2 自己的 installed package 重新验证 root type/runtime。
它不证明 Alpha2 已升级、真实 DataX2 已接入、CTA/HFT 产品流程已成功，更不证明可见 release-mode
Tauri 或 native 任务验收。ChartX2 仍只拥有图表渲染与 chart-adjacent public seam；交易项目、账户和
策略事实仍由 Alpha2 编排。
