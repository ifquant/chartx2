# 背景

`0394` 为 row-time focus 增强了本地 tgz 消费者验证，但 fresh review 发现 verifier 在替换
为 root focus 场景时，不小心删掉了既有
`@chartx2/library/workbench-drawing-inspector` public subpath 的 consumer coverage。

这不是 chart seam 的问题，却会让一个发布包即使破坏已有 subpath 也可能通过 release gate。
本提交只修复验证边界，不改变 library API 或图表运行时。

## 主要目标

- 在 repo 外的临时 tgz consumer 中恢复 focused inspector subpath 的 type import 与 browser
  runtime import/assertion。
- 让 packed `type-probe.ts` 对 `PhaseOneTimeFocusResult` 的五个 variant 做 exhaustive switch，
  用 `never` guard 防止将来悄悄增加或遗漏 discriminator。

## 改动概览

- root import 继续验证 `ChartFrameShell` 和 `PhaseOneTimeScaleApi` 的完整 required interface。
- `type-probe.ts` 另外从 `@chartx2/library/workbench-drawing-inspector` import
  `WorkbenchDrawingInspectorPanel`，并通过所有 `exact | nearest | outOfDomain | ambiguous |
  noData` 分支及 `never` default 消费 focus result。
- 真实 Vite/Chromium fixture 同时 import root chart API 与 focused inspector subpath，且在创建
  canvas 前显式断言两个既有 public export 都存在。

## 关键知识

### 一个 package root smoke 不能代表所有 public entrypoint

`exports` map 的每个 subpath 都是独立 consumer contract。即使 root barrel 正常，某个 focused
subpath 的 JS、声明文件或运行时 Svelte module graph 仍可能坏掉。因此 release verifier 应保留
代表性旧 entrypoint，而不是让新功能测试替换全部兼容覆盖。

### `never` 是 discriminated union 的回归报警器

当 `switch (result.kind)` 已穷尽 union，default 中的 `const impossible: never = result` 才会
编译。将来有人新增结果 kind 却没更新 consumer 处理时，临时 consumer 自己的 `tsc` 会失败，
比只构造 `noData` mock 更能证明 public declaration 的真实可用性。

## 补充知识

- 负向验证要破坏被验证的真实依赖。本次临时删除 generated runtime fixture 对 focused subpath
  的 import，packed page 无法产生 probe result，`release:local:verify` 如预期 RED；恢复 import
  后 GREEN。
- 临时消费者安装在 workspace 外，且 Vite、Svelte plugin、Playwright 与 Chromium 都从其 own
  `node_modules` 解析。因此 root 和 subpath import 都实际来自 tarball，而非本地 source alias。

## 验证

- `pnpm release:local:verify`（PASS，temp tgz typecheck + Vite HTTP + Chromium real canvas）
- `pnpm check`（PASS）
- `pnpm test:unit`（PASS）
- `pnpm release:local:check`（PASS）
- `git diff --check`（PASS）
- actual negative proof：临时移除 generated runtime fixture 的
  `@chartx2/library/workbench-drawing-inspector` import，`pnpm release:local:verify` RED；恢复后
  GREEN。
- temp cleanup：browser/server 的 `finally` 与 consumer root `finally` 均执行；`/tmp` 无
  `chartx2-release-consumer-*` 残留。
- package source 未改，tgz SHA256 仍为
  `ed3dc752116b51ca5ae11c1fbbc30042395b38015d424acb3a533e9113cf9b4b`。

## 未覆盖项

- 不新增或修改 `focusTime`、inspector、package exports、chart renderer 或 Svelte component。
- 这仍不是 alpha2 consumer proof；alpha2 安装新 tgz 后的实际 use-case 验证另行负责。
