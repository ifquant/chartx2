# 0402：修订 Market Chart 回执认证、单次读取与异常边界

## 背景

`0400` 和 `0401` 已经把 Market Chart 的 generation、data identity、拒绝原因与双层终态账本写进 RFC。实现前的复核发现一个仍会误导宿主的字段：`rejected.mountLifecycleReceipt` 看起来像“已经被 ChartX2 检查过的回执”，但旧类型会把 command 中未经认证的值原样回显。

本提交仍是 docs-only amendment：它修改 `docs/alpha2-r11-market-chart-lifecycle-receipt-rfc.md`，不修改 library source、测试或 consumer/release 脚本。原本临时编号为 `0402` 的实现教程已改名为 `0403`，其实现内容和既有验证陈述不在本提交重写或背书。

## 本次裁决

- `rejected` 不再有 `mountLifecycleReceipt`。它只给出 `checkedMountLifecycleReceipt: MintedReceipt | null`：只有 ChartX2 读到并通过私有 registry 认证的同一 identity 才能出现；lookalike、clone、持久化值、primitive 和 getter 失败都必须是 `null`。
- RFC 加入真实性矩阵。当前 minted receipt 可以继续走 stale/readiness/identity/payload 决策；foreign minted receipt 是 `superseded`；owning unmount 才是 `disposed`；未注册 object/function 和所有非 identity 输入都是 `invalidRequest`，且 checked 值为 `null`。
- command 的 `requestId` 必须先且只读一次。读失败或不是安全非负整数时，没有可关联 id，因此零 completion、零 ledger reservation、零其他字段读取、零 resolver。
- 安全 id 先按 exact command object identity reserve，才读取 receipt；receipt 也只读一次。receipt getter 抛错时，已预留 command 产生一次 typed `invalidRequest`，其 checked receipt 为 `null`，之后不再读 command 的其他字段。
- receipt/id 的私有账本接受 object 或 function 作为 JavaScript identity key；这不把函数自动变成 receipt。函数只有私有 factory/registry 真正注册后才 minted，公开 API 没有函数回执创建路径。
- `focusTime` 或 chart 内部不变量抛错不是用户请求错误。实现必须先把私有 reservation 终结以禁止 replay，然后原样 rethrow，且不向 host 发 completion。

## 为什么 `checked` 比回显输入更重要

宿主不能从“命令里写了一个 receipt”推出“图表认可了它”。若 rejected completion 把输入直接回显，宿主、日志或后续 reducer 很容易把伪造 token 当作生命周期事实。`checkedMountLifecycleReceipt` 改为仅表达 ChartX2 已认证的事实；`null` 则明确表示没有可证明的 receipt，而不是隐藏一份猜测。

同理，accessor 是外部输入边界。重复读 getter 不但会重复副作用，也可能让一次 command 在两个不同值之间漂移。先读并冻结 `requestId`，再 reserve exact command，再单读 receipt，才能让同步 callback 重入、恶意 getter 与 remount 都保持确定的终态账本。

## 要求的验证矩阵

- 用当前 minted、foreign minted、owning-dispose、object/function lookalike、clone、primitive、`null` 和 receipt getter throw 覆盖真实性矩阵，断言 rejected 绝不携带旧 `mountLifecycleReceipt`。
- 用 getter 计数与 throw fixture 覆盖读取顺序：requestId 无效时不读其他字段；safe id 的 command 在 receipt 前 reserve；receipt throw 只 terminal 一次且 checked 为 `null`；identity/focus getter 不重读。
- 用 object/function identity ledger 覆盖 forged function、注册 identity、跨 component/remount/re-entry 的 pair 去重；不把任何未注册 function 当作合法 receipt。
- 用 resolver/chart throw fixture 覆盖“private terminalize → rethrow → zero completion → replay silent”的顺序。
- 完成实现后再运行 `pnpm check`、相关 unit/production-route tests、`pnpm test:unit` 与 `pnpm release:local:check`。本次 docs-only amendment 没有执行这些命令，不能将未来实现教程中的 PASS 记录当成本提交证据。

## 未覆盖项

- 不改变既有 `PhaseOneTimeFocusRequest` / `PhaseOneTimeFocusResult` 的解析或 viewport 语义。
- 不改 Alpha2、DataX2、Tauri/Rust、marker 或任何交易领域状态。
- 不证明 packed package、Browser fixture、后台进程或截图等同于可见 native Tauri 与真实 DataX2 验收。
