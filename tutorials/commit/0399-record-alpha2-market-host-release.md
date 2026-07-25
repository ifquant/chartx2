# 记录 alpha2 Market 宿主的 chartx2 发布前置条件

## 背景

alpha2 的 Market 工作台要在图表附近展示策略相关的输入区，以及订单、成交、持仓、账户等事实。
但 chartx2 只能提供图表和 chart-adjacent UI shell，不能变成 alpha2 的应用外壳、账户账本或交易命令
系统。此前的实现已经通过 fresh review，并从准确的 committed HEAD 打出了一个本地 package。

本提交不修改图表源码或重新打包；它把“哪一个 source、哪一个 `.tgz`、哪些检查、还缺哪一步”写成
可复核的 release 身份链，防止后续 alpha2 因为同名路径或陈旧产物而接错包。

## 主要目标

- 固定已审查 source HEAD `d1f84d3d9a20faffb4c3760278266ba1bd0a2a22` 与 `GO — P0=0 / P1=0 / P2=0`。
- 记录 `chartx2-library-0.1.0.tgz` 的大小、SHA-256、SHA-512 和 pnpm SRI，让消费者可确认所装包
  就是经过验证的包。
- 说明 `pnpm release:local:check` 实际证明的 package-root 类型/运行时/外部 consumer 边界，以及
  alpha2 install proof 为什么仍是下一步。

## 改动概览

- 新增 `docs/alpha2-w6-chartx2-prerequisite-release.md`：记录这次 Alpha2 W6 的前置 release
  scope、两个窄 presentation seam、已审查 source HEAD、authoritative command 和 PASS 结果。
- 文档列出包文件的完整 digest 链。SHA-512 的 hex digest 与 SRI 的 base64 digest 是同一份内容的
  两种表达；两者都不是“文件路径正确”的替代品。
- 文档明确 package declaration/runtime proof：`@chartx2/library` 的 root export 从已打包 `dist`
  提供，workspace 外 consumer 真正安装 tgz 并挂载组件。它不会因为 source workspace 能运行就
  自动成立。
- 文档保留未完成边界：alpha2 还没有 ordinary-install 该 artifact，也没有从自己的
  `node_modules` 做 Market workbench 或 desktop runtime 验证。

## 关键知识

### 为什么要同时记录 Git HEAD 和 tarball hash

Git HEAD 说明“审查的是哪份源码”，hash 说明“消费者安装的是哪份二进制产物”。两个条件缺一不可：
源码没变但 package 可能由不同环境/不同时间重新生成；包名和路径没变也可能被覆盖。只有
`HEAD + command result + exact digest` 才能形成可追溯的 release identity。

使用下面命令可在不重新构建的情况下验证现有 artifact：

```bash
shasum -a 256 /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
shasum -a 512 /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
wc -c /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
```

### release check 和 alpha2 integration 不是同一层证据

`pnpm release:local:check` 依序运行 `pnpm check`、`pnpm test:unit` 和
`pnpm release:local:verify`。最后一项会让临时外部 consumer 从 `.tgz` 的
`@chartx2/library` root import 并运行 Svelte/browser probe，因此它是 package 边界证据。

它仍不能证明 alpha2 的 lockfile 指向该 artifact、alpha2 没有 source link、alpha2 传入的事实和
callbacks 正确，更不能证明 Tauri 或 live/CTP 行为。那些是消费方自己的安装和产品流程验证。

## 验证

本提交没有重跑 release 构建，避免覆盖已获准的 artifact。提交前执行：

```bash
shasum -a 256 /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
shasum -a 512 /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
wc -c /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
git diff --check -- docs/alpha2-w6-chartx2-prerequisite-review.md \
  docs/alpha2-w6-chartx2-prerequisite-release.md \
  tutorials/commit/0399-record-alpha2-market-host-release.md
```

结果：三个 artifact identity 值匹配既定 release record；文档 diff 无 trailing whitespace。

## 未覆盖项

- 本提交不变更 `packages/chartx2`、example、tests、package artifact 或 release script，也不重跑
  `pnpm release:local:check`。
- 不安装或改动 alpha2，不执行 Cargo/Tauri/debug/live/CTP 验证。
- Rust、自定义脚本、策略执行和账户/订单真相仍是 alpha2 后续产品流程的职责，不属于这两个
  chartx2 presentation seam。
