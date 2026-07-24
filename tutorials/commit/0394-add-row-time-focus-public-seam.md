# 背景

alpha2 的成交记录需要把用户当前选择的 canonical fill 定位到图表时间轴。此前可用的
`locateTrade(...)` 是完整交易的标记、连线和价格范围能力；把一笔 fill 伪造成 trade 会把
选择语义、marker 与 viewport 混在一起。因此本提交提供一个只负责共享时间轴定位的最小
public seam。

## 主要目标

在 `PhaseOneTimeScaleApi` 增加 required 的
`focusTime({ time, maxDistance, paddingBeforeBars?, paddingAfterBars? })`，并让 host
能穷举处理 `exact`、`nearest`、`outOfDomain`、`ambiguous`、`noData` 五种结果。

它只读取 `ChartModel` 当前 `barSequence.axisBars`，只在成功时更新 time scale；它不创建
marker、不改变价格范围，也不保存选择状态。

## 改动概览

- 新增纯函数 `internal/model/time-focus.ts`。它先验证请求和 axis invariant，再按固定顺序
  判断空轴、域外、最近候选、容忍距离、重复时间与唯一成功；等距时永远选择较早时间。
- `chart-scale-commands.ts` 将成功结果的 logical range 通过既有视窗应用路径单次写入、单次
  render。失败和抛错发生在任何写入之前。
- `PhaseOneChartHarness → ChartScaleOwner → TimeScaleApi` 明确把
  `contextSnapshot().barSequence.axisBars` 作为唯一时间轴 authority。
- public root 仅导出 request/result 类型和 required method；没有导出 resolver、logical index
  或其他 internal handle。
- 本地 release verifier 现在创建 repo 外临时消费者，从 `.tgz` 安装它自己的精确依赖，使用
  Vite HTTP + 临时消费者自己的 Playwright Chromium 创建真实 canvas。它验证类型、exact、
  bounded nearest、before-first、max-distance、noData、拒绝路径视窗不变与旧 root export。

## 关键知识

### 先解析，再产生副作用

`resolveTimeFocus` 是 pure resolver：结果中只有成功分支带 internal logical range。命令层看到
该 range 才调用既有 time-scale application。这种先计算、后提交的两段式设计，让
`outOfDomain`、`ambiguous`、`noData` 与 validation throw 都自然保持零 render/零 viewport
写入，而不需要每个失败分支各自撤销状态。

### 时间戳不能默认“就近即可”

`maxDistance` 是 required。`0` 表示 exact-only，正数才是调用者明确授权的 bounded nearest。
这避免在交易日间隙、不同周期或稀疏 axis 上静默跳到很远的一根 bar。图表库不知道产品的
session 与 sampling policy，所以 tolerance 应由 host 明确给出。

## 补充知识

- TypeScript 的 structural interface：给 `PhaseOneTimeScaleApi` 增加 required method 会使完整
  mock/implementation 在编译期要求同步更新。这是 pre-1.0 的有意 source migration；不能把
  `focusTime` 设 optional 来掩盖它。
- 打包测试不能只跑 workspace import。临时目录安装 tgz、启动 HTTP server、在浏览器执行 canvas
  才能同时证明 package export、声明文件与实际浏览器 module graph 都来自发布物。

## 验证

- `pnpm --filter @chartx2/library test:unit`（PASS，163 files / 572 tests）
- `pnpm check`（PASS，0 errors / 0 warnings）
- `pnpm test:unit`（PASS，library 572 tests；example 16 tests）
- `pnpm release:local:verify`（PASS，temp tgz consumer + Vite HTTP + Chromium real canvas）
- `pnpm release:local:check`（PASS）
- `git diff --check`（PASS）
- 实际 mutation：临时将 before-first guard 改为 first-row `nearest` clamp；source unit 与 packed
  browser gate 都 RED；恢复 exact guard 后两者 GREEN，无残留 diff。
- release tarball SHA256：`ed3dc752116b51ca5ae11c1fbbc30042395b38015d424acb3a533e9113cf9b4b`
- release tarball SHA512：`d03227aa9c4cf620c40af29ef4dd42fba7ac03de43038eca5f2e74f986b6b919efe6a216eccbdc8733a0787a278ea39e90dea77772d70ccd007dc69e3f4b0e12`

## 未覆盖项

- 本提交不实现 alpha2 的 fill selection、文案、时间单位证明或 tolerance 推导；alpha2 只能通过
  public root 使用该 seam。
- 不做 multi-chart/source identity、study-local focus、marker/drawing、持久化、event bus、策略
  或 Tauri/Rust 改动。
- duplicate time 的 public main-series setter 当前会拒绝输入；重复 axis 的 fail-closed 行为由
  source unit 冻结，供未来 price-based/composed axis 使用。
