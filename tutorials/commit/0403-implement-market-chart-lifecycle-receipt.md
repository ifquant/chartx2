# 0403：实现 Market Chart 生命周期回执与时间定位

## 背景

Alpha2 需要把报告中的一条已证实事实定位到当前项目图表的同一根 K 线，但它不能持有 ChartX2 的 canvas、DOM 或私有 chart API。`0400` RFC 已冻结了回执、数据身份和一次性 terminal completion 的边界；本提交实现该边界。

## 主要目标

让 `PhaseOneMarketChartSurface` 在自己的生命周期内签发 opaque receipt，并只对当前 receipt 与当前 `dataIdentity` 的命令调用已有的 `timeScale().focusTime(...)`。

## 改动概览

- 从 `@chartx2/library` 根入口导出 V1 receipt、data identity、command 和 completion 类型。
- 新增两级模块私有 ledger：读到安全 `requestId` 后立即预留 exact command object，object 或 function receipt 再以 `(receipt, requestId)` 跨实例去重；receipt 仍只能由私有 factory 铸造并以同一 object reference 认证。
- surface 在 mount、内部 chart replacement、`dataIdentity.key` 改变时轮换 generation；`setData` 与普通 auto-fit 完成后才发布 receipt 并消费命令。
- 将 `exact`、`nearest`、`outOfDomain`、`ambiguous`、`noData` 原样保留为 `completed.result`；生命周期拒绝只使用独立 union。
- `completed` 保持非空字段，并冻结 completion 与 `dataIdentity` 快照；`request/result` 按 RFC 原样保留引用。`rejected` 只携带认证后的 `checkedMountLifecycleReceipt`（无法认证时为 `null`）以及当前 surface identity 的冻结快照 `currentDataIdentity` 或 `null`，不暴露未经认证的输入 receipt，也不回填 expected identity。
- 扩展 packed tarball consumer：通过根入口实际挂载 surface，验证 receipt 回调→command→completion、callback 重入、remount 不 replay、presentation-only 更新不轮换及 identity 更新会轮换。

## 关键知识

### opaque receipt 不是 chart 句柄

receipt 本身没有公开字段，也没有创建 API。TypeScript 的 nominal class 只帮助调用方传递类型；运行时信任来自 ChartX2 模块私有 `WeakSet` 对同一对象引用的检查。因此 spread、JSON、`structuredClone` 和手工 lookalike 都不能变成有效凭据。

### terminal ledger 必须在回调之前记录

宿主 callback 可以同步更新 Svelte props，resolver adapter 也可能同步重入。safe id 的 command object 在读取 receipt 前就标记为 `inflight`；如果 receipt 是对象或函数，再预留 receipt/id pair。两层都在 resolver 或 callback 前完成，才能让 `receipt: null`、forged/callable receipt、等价新 command object、remount 和同步递归都只产生一次 terminal。

### hostile accessor 也必须只有一次观察

命令来自宿主边界，getter 可能抛错、返回变化值，甚至在读取时同步重入。因此实现严格按顺序各读取一次 `requestId`、receipt、expected identity 和 focus：无法得到安全 id 时零 completion 且不碰后续字段；receipt getter 抛错时只生成一次、`checkedMountLifecycleReceipt: null` 的 `invalidRequest`；expected/focus getter 抛错则保留已认证 receipt 与当前 identity 快照。完成比较、resolver 与 completion 都只复用这些局部快照，不重新读取宿主对象。

## 补充知识

- `dataIdentity.key` 是宿主对 axis 内容的明确承诺。改变 marker、状态文案、formatter 或等价 model 对象不应轮换 generation；只要 axis 数据可能改变解析结果，宿主就必须先换 key。
- `noData` 不等同于生命周期坏了。它仍是 time-focus resolver 的业务结果；`superseded`、`disposed`、`dataNotReady` 才说明 lifecycle 不能调用 resolver。
- malformed 或抛错的 `requestId` 没有可证明的 correlation id，因此零 completion、零 receipt 访问，也不预留命令。resolver/chart invariant 抛错属于内部失败：ledger 先 terminalize，再原样向上抛出且零 completion；同一命令之后仍不能重试或换一套 viewport。

## 验证

- `pnpm check`（PASS，library 与 example 均为 0 error）。
- `pnpm test:unit`（PASS，library 165 files / 591 tests；example 4 files / 16 tests）。
- `pnpm build`（PASS；example 保留既有大 chunk warning）。
- `pnpm release:local:check`（PASS；独立临时目录从打包 tarball 根入口完成正/负 type probe 与 Playwright consumer probe）。

## 未覆盖项

- 未修改 Alpha2、DataX2、Tauri/Rust、marker 语义或任何交易事实。
- packed consumer 与 Browser probe 证明 public package/Svelte route，不证明可见 native Tauri 或真实 DataX2 任务验收。
