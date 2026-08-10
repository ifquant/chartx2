# 0405：在发布前验证打包后的 Lifecycle 根入口

## 背景

`0403` 已把 Market Chart lifecycle 类型加入 `src/lib/public/index.ts`，但本地发布文件名仍是
`chartx2-library-0.1.0.tgz`。仅检查源码或同名 tgz 的存在，无法证明这个文件确实由当前源码重新
生成；旧的声明 barrel 若漏掉 `market-chart-lifecycle`，消费方会在根入口类型导入时失败。

这次修复不改变任何公开合同或版本。它把证明对象从源码移到 staged tarball 本身：只有 tar 内的
root barrel、public declaration/runtime barrel 和 lifecycle 声明都完整，发布脚本才会替换现有文件。

`0404` 的 release **门禁方法**已被本次 tarball 自证取代：它记录的 artifact identity 仍可复现，
因为 `0405` 只改了未打包的 release verifier，fresh pack 的 SHA-256 仍为
`4373d4ef48603d0d9ebd3e60e4d6d8a402a888d81c779294bbfdc0168f2214a1`。因此不能把同名文件或 hash
变化当作修复证据；新保证来自把实际 tar payload 检查纳入 canonical gate。后续若 package 内容变化，
才必须以新的 hash 和 installed-package 验证取代 `0404` 的 artifact receipt。

Alpha2 一侧若仍观察到根入口遗漏，只能作为其 installed virtual-store 或依赖解析状态陈旧的候选，
不能反向归因成 ChartX2 当前 tar 的事实：ChartX2 不拥有 Alpha2 的安装状态。这里能承担的责任是让
后续 canonical gate 明确读取本仓库刚打出的 payload，并让 workspace 外 consumer 从该 tgz 的
`@chartx2/library` 根入口完成 type 与 runtime 验证。

## 改动

- 新增 `scripts/verify-packed-chartx2-barrel.mjs`，直接读取 `.tgz` 内的 `dist/index.*`、
  `dist/public/index.*` 和 lifecycle 声明，检查 root 转发、lifecycle 与 surface 两条 public 转发，
  以及 command/completion 类型定义。
- `release:local` 在 staged tarball 通过上述检查之前不替换 release 目录中的旧文件，避免把不可用
  的同名包发布给 sibling app。staging 生命周期由 `try/finally` 包住：build、pack、payload
  verifier 任一步失败都会只清理本次 `.pack-*` 目录，不会删除旧 tgz。
- verified staged tarball 与 release root 位于同一父目录；成功时通过覆盖式 `rename` 发布同名文件，
  所以旧 artifact 会一直保留到 build、pack 和 tar payload 验证全部完成。不同文件名的旧版本只会在
  新 artifact 已发布后才被清理。
- workspace 外的 packed consumer 保留从 `@chartx2/library` 根入口的真实运行时挂载，并新增
  `PhaseOneMarketChartTimeFocusRejectedReasonV1` 的类型导入；这确保 lifecycle 类型不只是
  tar 文件中存在，而是能沿 package root 被 TypeScript 解析。
- consumer verifier 还把 declaration barrel 中 lifecycle export 人工移除，确认 verifier 会拒绝这一
  缺失-export 的反例形态；它不是对 `0404` artifact 的事后归因。
- `release:local:failure-test` 使用隔离的临时 release root：模拟 build failure 与实际重打一个
  移除了 lifecycle declaration export 的 staged tar。两种失败均断言旧 artifact hash 未变且没有
  `.pack-*` 残留；随后成功发布也断言零残留。

## 为什么要同时检查声明和运行时 barrel

类型导入只读取 `.d.ts`，而 Svelte surface 的真实挂载读取 `.js`。二者任一条转发缺失都会让根入口
合同不完整。因此发布前检查覆盖二者，随后独立 consumer 再执行 TypeScript 和浏览器运行时 probe。

## 验证

本提交完成时应执行：

```bash
pnpm check
pnpm test:unit
pnpm build
pnpm release:local:failure-test
pnpm release:local:check
pnpm release:local:check
shasum -a 256 /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
tar -xOzf /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz package/dist/public/index.d.ts
```

第二次 release gate 的 hash 应与第一次一致；tar 内的 declaration barrel 必须包含
`export * from "./market-chart-lifecycle";`。这些检查只证明 ChartX2 已打包的公开 surface 与独立
consumer，不证明 Alpha2 已升级该包，也不证明 native Tauri 或交易流程验收。

## 未覆盖项

- 未修改 `@chartx2/library` 版本、Alpha2 依赖、ChartX2 runtime 合同或 chart rendering 实现。
- 未将 Browser/packed consumer 成功冒充 native desktop 验收。
