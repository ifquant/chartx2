# alpha2 W4：chartx2 row-time focus 最小 public seam 实施计划

> 状态：实施、修复与 fresh task review 已完成；等待独立 push 与 alpha2 consumer gate
> 基线：`chartx2/main@73e8db376717619fae91502d74c440c8fa57f88b`
> 基线关系：`main...origin/main [ahead 3]`
> 日期：2026-07-25
> 范围：alpha2 Round 6 W4 canonical fill row → chart time focus

## 1. 裁决

W4 需要一个新的、很小的 chartx2 public seam。

现有 `PhaseOneChartApi.locateTrade(...)` 不能复用：

- 输入是完整 trade，要求 entry/exit、价格、方向、数量和 PnL；
- 它保存 active trade-location state；
- 它可创建 marker、span、connector；
- 它同时调整 time range 和 price range；
- 它把域外时间解析到首尾 row；
- 把单 fill 伪造成 trade 会污染产品语义。

正式 seam 冻结为：

```text
canonical fill ts_ms
  → chart.timeScale().focusTime(...)
  → chartx2 active shared time axis
  → deterministic row resolution
  → chartx2 内部更新 viewport
  → exact/nearest/outOfDomain/ambiguous/noData
```

不在 `PhaseOneChartApi` 增加平行方法。alpha2 不获得 logical index、
source registry、canvas 或 renderer internals。

## 2. HEAD 与保护

实施前重新运行 `git status --short --branch`、`git rev-parse HEAD` 和
`git log -5 --oneline`。

本计划观察到 worktree clean，且以下 ahead commits 必须原样保留：

```text
73e8db3 feat(chartx2-market-surface): add host-driven chart controls
5b3f899 fix(chartx2-release): erase optional parameter syntax
1bd538b test(chartx2-shell): follow activity log panel ownership
```

禁止 squash、rewrite、drop、force push，或把 seam amend 到已有 commits。
禁止混入 alpha2、Tauri、Rust、DataX2、debug build 或 example 产品功能。

## 3. 当前 public/runtime 边界

正式 package root 路径为 `src/lib/index.ts → public/index.ts → public/market.ts`。

consumer 只允许从 `@chartx2/library` import；禁止 internal、raw source、
example-owned API、source alias、长期 `link:` 或 alpha2 私有 copy。

当前 `PhaseOneChartApi.timeScale()` 只公开 get/set visible logical range 与
options；W4 禁止 alpha2 自算 `timestamp → logical`。现有 owner 链是
`PhaseOneChartHarness → createChartScaleOwner → createTimeScaleApi → TimeScale`。

当前 chart-wide time source of truth：

```text
ChartModel.context().snapshot().barSequence.axisBars
```

每个 row 已有 `time:number` 与 `index:number`。选择它而不是 raw main data、
DOM、canvas、marker 或 study-local array，原因是：

- `TimeScale` 是 chart-level singleton；
- panes 共享一条 time axis；
- `axisBars` 已表达 current chart type 的真实 axis；
- time-based/price-based 均通过 `ChartBarSequence`；
- future multi-pane 不需要 pane selector；
- future multi-source 可继续由 ChartModel 组合 active axis。

`PhaseOneSeriesMarker`/`series.setMarkers(...)` 已存在且不修改。marker projection
与 row focus 是两条共享 timestamp、但 owner 分离的路径。

## 4. Public API

在 `chart-api-types.ts` 新增：

```ts
export type PhaseOneTimeFocusRequest = {
  time: number;
  maxDistance: number;
  paddingBeforeBars?: number;
  paddingAfterBars?: number;
};

export type PhaseOneTimeFocusResult =
  | {
      kind: "exact";
      requestedTime: number;
      resolvedTime: number;
      distance: 0;
    }
  | {
      kind: "nearest";
      requestedTime: number;
      resolvedTime: number;
      distance: number;
    }
  | {
      kind: "outOfDomain";
      requestedTime: number;
      reason: "beforeFirst" | "afterLast" | "maxDistanceExceeded";
    }
  | {
      kind: "ambiguous";
      requestedTime: number;
      resolvedTime: number;
    }
  | {
      kind: "noData";
      requestedTime: number;
    };

export type PhaseOneTimeScaleApi = {
  // existing methods unchanged
  focusTime(request: PhaseOneTimeFocusRequest): PhaseOneTimeFocusResult;
};
```

使用五个 top-level `kind`，而非 focused/notFocused 的二层 discriminator：

- consumer 可直接 exhaustive switch；
- 与 W4 用户文案一一对应；
- 不引入 exception-based domain flow；
- 不创建 selection/state object。

`time`、`resolvedTime`、`distance`、`maxDistance` 使用 active numeric chart
axis 的同一单位；chartx2 不宣称所有 numeric time 都是 Unix ms。alpha2 W4
可传 `canonicalFill.ts_ms`，但其 consumer test 必须证明 performance curve
points 与 canonical fills 都是 ms，不能把不同单位交给 seam。

方法落在 time-scale，因为它只读取 chart-wide axis、只改变 visible time range，
不碰 price/source/trade/marker/persistence。禁止另建 `locateFill`、event bus、
selection store 或 surface-private callback。

## 5. Deterministic resolution

### 5.1 Request 与 axis invariant

request 必须满足：

- `time`、required `maxDistance` 都 finite；
- `maxDistance >= 0`；
- optional padding 均为非负 `Number.isSafeInteger`。

non-empty axis 必须满足：

- 每个 `time` 与 logical `index` finite；
- logical indices strictly increase；
- times non-decreasing，允许 equal-time run。

invalid request 抛 generic `TypeError`/`RangeError`；invalid axis assert/throw
precise chartx2 invariant error。两者都在任何 side effect 前完成，不转成
noData/nearest/fallback，也不包含 product IDs。

### 5.2 唯一决策顺序

resolver 必须严格按以下 1–10 顺序：

1. validate request；
2. snapshot axis 并 validate invariant；
3. empty → `noData`；
4. before first / after last → `outOfDomain`；
5. resolve exact 或 lower/upper candidate，距离 tie 固定 earlier time；
6. non-exact `distance > maxDistance` → `outOfDomain/maxDistanceExceeded`；
7. scan accepted candidate 的完整 equal-time run；
8. run 长度大于 1 → `ambiguous`；
9. unique candidate → `exact`/`nearest` 并计算 range；
10. apply viewport exactly once，render exactly once。

这使五态互斥：duplicated nearest 若超 tolerance，先返回 maxDistanceExceeded；
只有本来可接受的 candidate 才检查 ambiguity。域外不得 clamp。

### 5.3 Nearest 显式 opt-in

`maxDistance` required 且与 axis 同单位：

- `0` = exact-only；
- 正数才允许 inclusive bounded nearest；
- `distance === maxDistance` 可接受；
- omitted/`undefined` 在 runtime validation 失败；
- chartx2 不猜 timeframe/session/sampling tolerance。

single-point 只接受 exact；其他请求按 before/after 返回 outOfDomain。当前
time-based main data 通常严格递增，duplicate tests 仍为 price-based/future
composed axis 冻结 fail-closed 行为。

## 6. Padding 与 viewport

默认：

```text
paddingBeforeBars = 8
paddingAfterBars = 8
```

只在 resolved unique row 后计算：

```text
desiredFrom = resolvedLogical - paddingBeforeBars - 0.5
desiredTo   = resolvedLogical + paddingAfterBars + 0.5
domainFrom  = firstLogical - 0.5
domainTo    = lastLogical + 0.5
from        = max(domainFrom, desiredFrom)
to          = min(domainTo, desiredTo)
```

规则：

- padding 不参与 exact/nearest；
- padding 不改变 requested/resolved time；
- padding 不把域外 request 拉回边界；
- edge row 可得到不对称上下文；
- `0/0` 仍产生一个 bar 宽度；
- single exact 仍有有效 range。

继续使用现有 visible-range application、spacing bounds、barSpacing/rightOffset。
result 不返回 logical range/index，因为 host 不需要，且实际 range 受 viewport
width 影响；resize 后重调由 chartx2 用新 layout 重算。

## 7. Side effects

command-layer contract：

| Path | axis data mutation | time-scale apply | render | price/persist |
|---|---:|---:|---:|---:|
| invalid request throws | 0 | 0 | 0 | 0 |
| invalid axis invariant throws | 0 | 0 | 0 | 0 |
| outOfDomain | 0 | 0 | 0 | 0 |
| ambiguous | 0 | 0 | 0 | 0 |
| noData | 0 | 0 | 0 | 0 |
| exact | 0 | 1 | 1 | 0 |
| accepted nearest | 0 | 1 | 1 | 0 |

任何路径都不创建 marker/drawing/trade overlay，不保存 selected row/product ID，
不改 symbol/timeframe/source/snapshot，不发布 event bus。command tests 必须用
spies 同时证明 time-axis options、render、price owner 与 persistence calls。

同一 axis/layout 下重复调用返回相同 resolution，不累积 offset。resize 后可安全
重调，不依赖上次 result。

## 8. Owner/files

### 8.1 Pure resolver

新增：

```text
packages/chartx2/src/lib/internal/model/time-focus.ts
```

仅负责 validation、五态 resolution、tie、max distance 与 padding range。
internal success 可携带 `{ result, logicalRange }`，但 logicalRange 不 public。

### 8.2 Scale command

修改：

```text
packages/chartx2/src/lib/internal/views/chart-scale-commands.ts
```

`createTimeScaleApi` 新增依赖：

```ts
getTimeAxisRows(): readonly { time: number; index: number }[];
```

`focusTime` 读取一次 axis snapshot，resolve；失败直接返回，成功复用同文件
private visible-range application 后返回 result。不要回调 public
`setVisibleLogicalRange` 形成自引用。

### 8.3 Owner wiring

修改：

```text
packages/chartx2/src/lib/internal/views/chart-scale-owner.ts
packages/chartx2/src/lib/internal/views/chart-harness.ts
```

harness 注入：

```ts
getTimeAxisRows: () =>
  this.runtime.contextSnapshot().barSequence.axisBars
```

禁止 renderer/DOM/canvas/marker/study-local/example fixture 成为 authority。

### 8.4 Public barrel

修改：

```text
packages/chartx2/src/lib/internal/views/chart-api-types.ts
packages/chartx2/src/lib/public/market.ts
```

`market.ts` type-export request/result。root 已 export `market`，不建 subpath；
不 export resolver、logical action、registry handle 或 alpha2-specific entry。

## 9. Backward compatibility

runtime/call-site usage additive：`PhaseOneChartApi` 无新 top-level method，
旧 time-scale/locateTrade/series/marker/snapshot/persistence 行为不变。

source compatibility 不是零迁移：完整 structural `PhaseOneTimeScaleApi`
implementations/mocks 必须新增 required `focusTime`。package 仍 pre-1.0
`@chartx2/library@0.1.0`，本次接受该 test-double/source migration；不得把方法
设 optional。tgz 文件名保持 `chartx2-library-0.1.0.tgz`。

## 10. Tests

### 10.1 Pure unit

新增 `packages/chartx2/tests/unit/time-focus.test.ts`，覆盖：

1. empty/noData；
2. unique exact；
3. lower nearer；
4. upper nearer；
5. tie earlier；
6. before first；
7. after last；
8. duplicate exact；
9. duplicate run 位于 first/middle/last；
10. duplicated nearest candidate 在 distance below/equal/above threshold；
11. single exact/non-exact；
12. required max 为 zero/equal/exceeded/large gap；
13. default/asymmetric/edge/zero padding；
14. unsafe padding、invalid request；
15. non-finite time/index、decreasing time、non-increasing logical index。

### 10.2 Command/owner

扩展：

```text
packages/chartx2/tests/unit/chart-scale-commands.test.ts
packages/chartx2/tests/unit/chart-scale-owner.test.ts
```

按 §7 table 证明 throwing/rejected/success paths；axis snapshot 由 owner 提供；
layout change 后重复 focus 使用新 width。pure resolver 不冒充 side-effect proof。

### 10.3 Public/package/runtime

扩展：

```text
packages/chartx2/tests/unit/chart-api-types.test.ts
packages/chartx2/tests/unit/chart-public-api.test.ts
packages/chartx2/tests/unit/public-index-contract.test.ts
packages/chartx2/tests/unit/package-dist-contract.test.ts
```

证明 type method、root exports、wrapper compatibility、built declaration 与无
internal resolver export；packed type probe 必须构造一个对象并
`satisfies PhaseOneTimeScaleApi`，覆盖完整 required interface。

在现有 chart runtime/harness fixture：create chart、add main series、set known
numeric rows、调用 focus、验证 exact/bounded-nearest 与 visible range；
rejected 后 range 不变；destroy。禁止 alpha2/DOM-row fixture。

## 11. Packed consumer

baseline artifact：

```text
/Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
SHA256 65ec82e205e73f99c7f47980aaa23eb494ec939e9ba615c111f9454ae8800f32
SHA512(hex) 7115821148576a7d11c40c9781de886f6482abfead07a9484ea3b249d41a39a438b7dbfbb77eb4a95e1db1abbf92b31142bc2bb786f3a818ecba40bdb9007023
alpha2 baseline lock integrity sha512-cRWCEUhXan0RxAyXgd6Ib2SCq/6tB6lITqOySdQaOaQ4t9v7t360qV4dsau/krMRQrwrt4bzqBjsukC9uQBwIw==
```

它不含 seam，不能作为完成证据。

扩展 `scripts/verify-chartx2-local-release-consumer.mjs`：

1. `mkdtemp` 创建 temp root；
2. temp package 从 tgz 安装，并 pin `@playwright/test@1.58.2`、
   `vite@6.4.1`、`@sveltejs/vite-plugin-svelte@5.1.1`、`svelte@5.55.1`、
   `typescript@5.6.3`；
3. matching Chromium 由 temp package 自己的 Playwright install/resolve；
4. type probe 只从 temp `node_modules/@chartx2/library` root import，exhaustive
   五态并 `satisfies PhaseOneTimeScaleApi`；
5. 写 HTML/module fixture，只从 packed root import；
6. 启动 temp Vite HTTP server；
7. 用 temp `node_modules` 的 Playwright 启动 Chromium 并 navigate；
8. real canvas create chart/set known rows/call `focusTime`；
9. 证明 exact、bounded nearest、before-first、max-distance、empty/noData；
10. rejected calls 前后 visible range 完全相同，旧 exports 仍存在；
11. destroy chart；
12. `finally` 关闭 page/browser/server 并删除 temp tree。

`pnpm release:local:verify` 必须调用这条完整 flow，因而
`release:local:check` 不能绕过。禁止 workspace runner/dependency、source/link、
SSR-only probe、只查 export name 或只读 `.d.ts`。ambiguous 由 source unit
证明，因为当前 public main-series setter 本身拒绝 duplicate time。

## 12. Actual mutation

做一次真实 implementation mutation：

```text
临时把 before/after guard 改成 clamp first/last 并返回 nearest
```

执行合同：

```text
mutate source guard
→ pnpm --filter @chartx2/library test:unit       # RED
→ pnpm release:local:verify                     # packed browser RED
→ revert exact mutation
→ rerun both                                    # GREEN
→ git diff --check + targeted diff              # no residue
```

两条 gate 都必须因域外错误 focus 而 RED；不做全仓 mutation sweep。

## 13. Gates 与 release evidence

```bash
pnpm --filter @chartx2/library test:unit
pnpm check
pnpm test:unit
pnpm release:local:verify
pnpm release:local:check
git diff --check
```

本 slice 无 rendering visual change，不要求全量 screenshot 更新；packed browser
probe 是 runtime evidence。不运行 cargo/debug。

完成后记录：

```bash
shasum -a 256 /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
shasum -a 512 /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
```

alpha2 Commit B 安装新 tgz 后另行记录 SHA256、lock sha512 integrity 与 installed
root type/runtime proof；chartx2 gate 不替代 alpha2 consumer gate。

## 14. Commit/review/push

本计划冻结提交使用 0393；随后 implementation 使用：

```text
tutorials/commit/0394-add-row-time-focus-public-seam.md
```

一个 coherent implementation commit：

```text
feat(chartx2-time-scale): add public row-time focus
```

仅含 resolver、time-scale API、owner wiring、public type、focused tests、packed
probe、tutorial 0394。Terra high 实施；本提交不改变已冻结的 API。

提交后 fresh Terra high review：API/owner、determinism、max distance、duplicate、
failure side effects、barrel、packed runtime、compatibility、scope。

finding 用 narrow fix + 下一教程 + 独立 fix commit，回同一 review loop；不
amend、不扩成 chart refactor。P0=P1=P2=0 后才 push。

```bash
git push origin main
git push origin main
git rev-parse HEAD
git rev-parse origin/main
```

最终 `HEAD == origin/main`，禁止 force push。

### 实际实施与 closure history（2026-07-25）

冻结计划之后，实施没有 amend 或重写既有提交，而是按窄切片形成如下实际历史：

```text
b4362000 docs(chartx2): freeze the row-time focus public seam plan
00e6eeb feat(chartx2-time-scale): add public row-time focus
13b5c57 fix(chartx2-release): preserve public consumer coverage
```

教程编号与提交对应为 `0393`（计划）、`0394`（实现）、`0395`（fresh review
发现的 release-boundary 修复）及 `0396`（本 closure）。初始实现 review 为
NO-GO（P1=1、P2=1）；`13b5c57` 以独立窄修复恢复既有 inspector subpath
consumer coverage，并补全 five-kind exhaustive type proof，fresh re-review 最终为
GO（P0=P1=P2=0）。

本 closure 是纯文档提交，不在此处 push，也不改变 API 或 release artifact。已验证的
tgz 为 SHA-256
`ed3dc752116b51ca5ae11c1fbbc30042395b38015d424acb3a533e9113cf9b4b`，SHA-512
`d03227aa9c4cf620c40af29ef4dd42fba7ac03de43038eca5f2e74f986b6b919efe6a216eccbdc8733a0787a278ea39e90dea77772d70ccd007dc69e3f4b0e12`。

下一道门是 alpha2：在 chartx2 提交被正常推送、同一 tgz 被安装后，alpha2 必须仅从
`@chartx2/library` 以 consumer 身份证明 canonical fill 的 `ts_ms`、curve time unit
与明确 `maxDistance` policy，再完成 five-kind UI 处理。chartx2 的 package gate 不能替代
这一宿主产品验证。

## 15. Alpha2 use

alpha2 调 `focusTime({time:canonicalFill.ts_ms,maxDistance:derivedCurveTolerance,
paddingBeforeBars:8,paddingAfterBars:8})` 并 exhaustive switch 五态。consumer
unit/runtime 必须证明 curve point `time` 与 fill `ts_ms` 均为 ms，并显式推导
curve/timeframe-aware tolerance；不得默认跨 gap。exact/nearest 才更新 row；
其余不 fallback。仍禁止 logical math、`locateTrade` 伪造或 deep import。

## 16. Deferred

本 seam 支持 shared time scale、multi-pane、current time/price-based axes、resize
重调和 future ChartModel-composed active axis。

本轮不做 multi-chart selection、sourceId/paneId、study-local focus、event bus、
selection store、persisted focus、strategy module、marker creation、symbol/timeframe
switch、portfolio/replay、alpha2 IDs、Tauri/Rust/DataX2。

未来出现多个独立 time domains 时，先设计 public axis/source identity；本轮不
预埋 stringly `sourceId?:string`。

## 17. GO / NO-GO

全部满足才 GO 给 alpha2 Commit B：

1. exact HEAD/status 已记录，ahead 3 保留；
2. 只新增 `PhaseOneTimeScaleApi.focusTime` 与两种 public types；
3. source 是 `ChartModel.context().barSequence.axisBars`；
4. generic time、required maxDistance、axis invariant、1–10 顺序与 padding 有 proof；
5. 所有 throw/reject 0 side effect，success apply/render exactly once；
6. locateTrade/marker/price/persistence 无 drift；
7. full-interface root type/build contract GREEN；
8. self-contained temp tgz + Vite/Chromium browser gate GREEN；
9. clamp mutation 使 source unit 与 packed browser 都 RED/revert/GREEN；
10. `release:local:verify` 与 `release:local:check` GREEN；
11. 新 tgz hashes 已记录；
12. fresh Terra review P0=P1=P2=0；
13. 独立 commit/tutorial；
14. push 后 `HEAD == origin/main`。

否则：

```text
chartx2 seam NO-GO
alpha2 W4 Commit B 不得用 private hack 继续
```

最终 ownership：alpha2 owns fill selection/user messaging；chartx2 owns time
resolution/viewport；ChartModel owns active axis/source composition；series owns
markers。两边都不创建第二套 chart state machine。

## Review response mapping

- P1-1：`maxDistance` required，0 exact-only，nearest explicit bounded opt-in。
- P1-2：API 改为 active-axis generic `time/distance`；alpha2 证明两侧均为 ms。
- P1-3：冻结 axis invariant、safe-integer padding 与唯一 1–10 决策顺序。
- P1-4：packed gate 改为 temp-owned exact dependencies、HTTP Vite、Chromium。
- P2-1：声明 runtime additive，但 full structural mocks 有 pre-1.0 source migration。
- P2-2：command tests 枚举所有 throw/reject 0/0/0/0 与 success 1 apply/1 render。
