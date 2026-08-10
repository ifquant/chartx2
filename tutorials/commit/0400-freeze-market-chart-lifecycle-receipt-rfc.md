# 0400：冻结 Market Chart 生命周期回执 RFC

## 背景

Alpha2 R11 的报告页需要让用户点一条已确认的成交/填单事实，然后把当前项目的图表定位到同一根 K 线。ChartX2 已有公开的 `PhaseOneTimeScaleApi.focusTime(...)`，但 `PhaseOneMarketChartSurface` 还没有把一次定位同“当前挂载的组件”和“当前数据”绑定起来的公开回执。

如果 Alpha2 去拿组件私有 ref、查询 canvas/DOM，或者调用底层 API 后自己宣布“已经定位完成”，就会把 ChartX2 本该拥有的图表生命周期带到宿主中。切项目、换数据、重建 chart 或迟到回调时，都可能定位到错误的一份图。

## 主要目标

这次只新增设计 RFC，冻结下一实现切片的边界：由 ChartX2 surface 签发 opaque mount receipt，宿主声明当前 `dataIdentity` 和一次单调 `requestId` 的 focus command，surface 再给出恰好一次 terminal completion。

RFC 已得到 Alpha2 `1858` 的跨仓库批准。初稿经过 fresh Sol-high 审查后发现 3 个 P1，并在本教程对应的修订中关闭：generation 旋转条件不够确定、terminal ledger 只写成组件局部、receipt 的 TypeScript 外形可能被误解为 runtime 信任来源。它仍不代表 API、测试、tarball 或 Alpha2 集成已经存在。

## 改动概览

- 新增 `docs/alpha2-r11-market-chart-lifecycle-receipt-rfc.md`，定义根入口拟公开的 V1 command、receipt、identity、completion 和拒绝原因 union。
- 保留既有 `PhaseOneTimeFocusRequest` / `PhaseOneTimeFocusResult`：ChartX2 正常的 `exact`、`nearest`、`outOfDomain`、`ambiguous`、`noData` 仍在 `completed.result` 中完整表达；生命周期拒绝不混进去。
- 冻结 generation 只在 mount、内部 chart-instance replacement 或 `dataIdentity.key` 改变时旋转；宿主必须在任意 axis dataset/window/revision/content 改变前更新该 key，marker/status/formatter/options/等价 model 重建不能误旋转。
- 冻结 module-private、process-local `WeakSet`/`WeakMap` terminal ledger：同一 `(receipt, requestId)` 只会 terminal 一次，跨 component remount 也不会 replay。
- receipt 由私有 factory 生成冻结、不可序列化 token；runtime 只接受 WeakSet/WeakMap 中同一 object reference，不能相信 symbol/shape、Reflect/spread/clone/JSON/persistence/cross-realm copy。
- 明确 data readiness、generation 的 axis apply→auto-fit→receipt publication 顺序、identity、rebuild、remount、unmount、callback re-entry 的 fence，以及 focus 对 viewport/marker 的精确副作用表。
- 写出 future package/test/release gates，要求从 `@chartx2/library` root 的 packed consumer 证明，而不是依赖 source link。

## 关键知识

### 1. opaque receipt 不等于公开 chart 句柄

receipt 是“这一次 surface generation 仍然有效”的不可解释凭据。它不是一个带 secret 字段的 JSON 对象：ChartX2 私有 factory 创建并冻结 token，以 module-private `WeakSet`/`WeakMap` 对同一 object reference 做 runtime 认证。宿主只能原样回传它，不能从中拿到 canvas、DOM、logical index 或私有 chart API；复制、持久化或跨 realm 传递都会失效。这样 ChartX2 仍拥有时间轴解析和 viewport mutation，Alpha2 仍拥有项目、成交和数据选择的业务含义。

### 2. 业务结果和生命周期结果应分两层

`focusTime` 的 `noData`、`ambiguous` 或 `outOfDomain` 是图表时间轴的正常业务结果，不是组件坏了。`dataIdentityMismatch`、`superseded`、`disposed` 才是生命周期拒绝。两者混成一个模糊字符串，调用方就无法判断是该换数据、重发请求，还是向用户说明当前 bar 不存在。

## 补充知识

- `requestId` 只有在同一 receipt 内严格递增才有意义。terminal ledger 在 receipt 仍被引用时跨组件实例保留：已经 terminal 的旧 pair 静默忽略；第一次遇到旧但未消费的 minted receipt 才会得到一次 `superseded`。owning unmount 的 pending command 则优先得到一次 `disposed`。
- 图表换了 axis 内容就不是“普通刷新”。宿主必须先换 `dataIdentity.key`，surface 才会旋转 generation；随后必须完成 `setData`、auto-fit、receipt publication，才可以消费该 generation 的 command。
- marker 和时间定位共享时间字段，但不是同一 owner。marker 是宿主给出的业务投影；focus 只改变现有 time viewport，不能趁机添加、删除或证明 marker。

## 验证

- `git status --short`（开始时仅有本 RFC 与本教程两个预期新增文件）。
- `git diff --check --no-index /dev/null docs/alpha2-r11-market-chart-lifecycle-receipt-rfc.md`（PASS）。
- `git diff --check --no-index /dev/null tutorials/commit/0400-freeze-market-chart-lifecycle-receipt-rfc.md`（PASS）。
- `rg -n "WeakMap|WeakSet|dataIdentity.key|PhaseOneTimeFocusResult|release:local:check" docs/alpha2-r11-market-chart-lifecycle-receipt-rfc.md`（PASS：RFC 包含 P1 修订后的 lifecycle/identity/release gates）。
- `find tutorials/commit -maxdepth 1 -name '04*.md' | sort`（PASS：0399 后首次新增编号为 0400）。

## 未覆盖项

- 没有修改 `packages/chartx2/**` 源码、测试、public barrel、package、lockfile、版本或 release artifact。
- 没有运行 package release 或 Browser/native 桌面验收；本次只是 docs-only RFC，后续实现必须以独立提交和 fresh review 完成。
