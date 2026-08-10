# 0401：修订 Market Chart 生命周期拒绝身份与终态账本

## 背景

`0400` 已冻结 Market Chart 的 receipt、data identity 与声明式时间定位边界。在开始实现前，fresh architecture review 发现拒绝回执仍可能把宿主的 `expectedDataIdentity` 冒充为 surface 当前数据事实，并且 malformed command 的“一次终态”边界没有区分 command object 与 receipt/id 两种身份。

本提交只修订 RFC，不修改 library source、测试或发布脚本。实现教程顺延为 `0402`，避免把这次契约修订误读成已完成行为。

## 本次裁决

- `completed` 保持非空 `dataIdentity`、原始 `request` 与原始 resolver `result`：它们只在实际当前 generation 已通过所有 fence 后出现。
- `rejected` 改为 `currentDataIdentity: Identity | null`。它是 surface 当下真实 identity 的冻结快照；没有当前数据就写 `null`，绝不把 command 的 `expectedDataIdentity`、旧 identity 或推断 key 当作回退。
- 冻结两层私有 ledger：safe id 的 exact command object 先 reserve，阻止同一 Svelte prop / callback 同步重入；object-valued receipt 再按 `(receipt, requestId)` reserve，覆盖等价 command object、remount 和其他 component。
- `requestId` 不合法时没有可关联的事实，必须零 completion、零 focus，不能编造 `NaN` 或强转后的 id。safe id 但 receipt 不是 object 时只承诺同一 command object 一次；不同 malformed object 不被伪称为同一 lifecycle pair。
- 固定拒绝优先级：先忽略已 reserve，再 reserve；receipt 无效优先 `invalidRequest`，foreign minted 为 `superseded`，owner disposal 为 `disposed`，随后 stale、current data readiness、identity mismatch，最后才检查 focus payload 并决定 `invalidRequest` 或 `completed`。

## 为什么需要两层账本

receipt ledger 证明“同一个生命周期 token + 请求编号”不重放，但它不能处理 `receipt: null` 的错误请求。command-object ledger 则在解析前锁住同一个对象，避免 callback 改 props 让同一错误 command 重复发出拒绝。两者组合后，既不把坏 receipt 信任成合法 token，也不为了去重而伪造一个不存在的 receipt identity。

同样，拒绝中的 `currentDataIdentity` 是诊断事实，不是用户请求的愿望。若 surface 没有数据，回显 expected key 会让 Alpha2 误以为该数据仍挂载在当前 chart 上；`null` 才能保留“当前没有可证明数据”的事实。

## 要求的实现测试

- 同一 safe-id command object 在同步 callback re-entry 下只产生一次 terminal；包括 `null`、primitive、forged receipt。
- 不同 command object 但同一 object receipt/id 在 remount 或不同 component 下只 terminal 一次；forged object 也只能一次 `invalidRequest`。
- 非法 requestId 不产生 completion、不访问 resolver、不制造可重放 ledger id。
- rejection 的 `currentDataIdentity` 是冻结当前 snapshot 或 `null`；测试明确证明它不会回退为 `expectedDataIdentity`。
- priority collision 覆盖 invalid receipt、foreign minted receipt、owner disposal、stale id、缺少 current identity、identity mismatch 与 malformed focus，且每条拒绝路径没有 viewport/marker side effect。

## 审查与验证状态

- fresh Sol architecture review：本契约修订已纳入 implementation binding。
- 本切片是 docs-only；尚未运行 `pnpm check`、`pnpm test:unit` 或 release gate，且不把它们误报为本次完成证据。
- source、unit test、consumer script 的已有未提交改动刻意未触碰；它们将由后续实现切片独立验证与审查。

## 未覆盖项

- 不改变 `PhaseOneTimeFocusRequest`、`PhaseOneTimeFocusResult` 或 chart renderer / ChartX2 公共 ownership。
- 不证明 Alpha2 集成、real DataX2、release tarball 或可见 native Tauri 验收。
