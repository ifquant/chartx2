# Alpha2 R11：Market Chart 生命周期回执与时间定位 RFC

> 状态：**APPROVED FOR IMPLEMENTATION**。本文件冻结下一实现切片的公开契约；当前仓库尚未实现其中任何新 API。
>
> 依据：Alpha2 已提交的 `tutorials/commit/1858-amend-r11-chartx2-surface-time-focus-seam.md`；ChartX2 当前基线 `754eb8bc3570c2588ca865841827e597d5af6ffd`。
>
> 范围：`PhaseOneMarketChartSurface` 的 declarative、surface-owned time-focus lifecycle seam。它不改变已发布的 `PhaseOneTimeFocusRequest`、`PhaseOneTimeFocusResult` 或 `PhaseOneTimeScaleApi.focusTime(...)` 的语义。

## 1. 问题与裁决

`@chartx2/library` 根入口已经公开 imperative `PhaseOneTimeScaleApi.focusTime(...)`。它正确地拥有 active axis 上的时间解析和 viewport mutation，却不能说明一次 host 层的请求是在哪个 mounted surface、哪一份数据上完成，也不能拒绝重新挂载或迟到的声明式命令。

Alpha2 的报告行需要“选择一条已证实的业务事实，并请求当前项目图表定位”。Alpha2 不能持有组件私有 chart ref、访问 DOM/canvas、读取 logical index，或把一次 imperative call 自行叙述为完成。ChartX2 也不能接管项目、成交、运行、DataX2 或 marker 的业务事实。

因此新增一个只属于 `PhaseOneMarketChartSurface` 的公开声明式 seam：

```text
host business selection + stable current data identity
  -> surface receives command
  -> surface verifies its opaque mounted lifecycle receipt and current data identity
  -> existing timeScale.focusTime(request)
  -> exactly one terminal lifecycle completion callback
```

这个 seam 不泄露 chart API、canvas、DOM、renderer、logical range 或 source registry。`PhaseOneTimeScaleApi.focusTime(...)` 继续是低层 public API；新 surface command 只协调其自身生命周期，不创建第二套时间解析器。

## 2. 拟新增的根入口类型

实现必须从 `packages/chartx2/src/lib/public/index.ts` 根入口导出下列类型。命名可以因仓库惯例微调，但字段、discriminator 和语义不得放松。

```ts
// Nominal declaration only. Its constructor is not a public creation path and
// its private member is not a runtime receipt field.
export declare class PhaseOneMarketChartMountLifecycleReceiptV1 {
  private readonly phaseOneMarketChartMountLifecycleReceiptV1: never;
  private constructor();
}

export type PhaseOneMarketChartDataIdentityV1 = Readonly<{
  /** Host-created stable identity for exactly the data currently represented by model. */
  readonly key: string;
}>;

export type PhaseOneMarketChartTimeFocusCommandV1 = Readonly<{
  /** Non-negative safe integer, strictly greater than the prior consumed command in this lifecycle. */
  readonly requestId: number;
  readonly mountLifecycleReceipt: PhaseOneMarketChartMountLifecycleReceiptV1;
  readonly expectedDataIdentity: PhaseOneMarketChartDataIdentityV1;
  readonly focus: PhaseOneTimeFocusRequest;
}>;

export type PhaseOneMarketChartTimeFocusRejectedReasonV1 =
  | "staleRequest"
  | "dataIdentityMismatch"
  | "dataNotReady"
  | "invalidRequest"
  | "disposed"
  | "superseded";

export type PhaseOneMarketChartTimeFocusCompletionV1 =
  | Readonly<{
      readonly kind: "completed";
      readonly requestId: number;
      readonly mountLifecycleReceipt: PhaseOneMarketChartMountLifecycleReceiptV1;
      readonly dataIdentity: PhaseOneMarketChartDataIdentityV1;
      readonly request: PhaseOneTimeFocusRequest;
      readonly result: PhaseOneTimeFocusResult;
    }>
  | Readonly<{
      readonly kind: "rejected";
      readonly requestId: number;
      readonly mountLifecycleReceipt: PhaseOneMarketChartMountLifecycleReceiptV1;
      /**
       * The surface's actual current identity at rejection time, or null when
       * the surface has no current trustworthy data presentation. This is not
       * the command's expected identity and must never be synthesized from it.
       */
      readonly currentDataIdentity: PhaseOneMarketChartDataIdentityV1 | null;
      readonly reason: PhaseOneMarketChartTimeFocusRejectedReasonV1;
    }>;
```

`PhaseOneMarketChartMountLifecycleReceiptV1` is a frozen, process-local, nonserializable token minted only by a module-private factory. The nominal declaration is compile-time ergonomics, not the runtime proof: implementation must register every minted object in module-private `WeakSet`/`WeakMap` state and runtime validation must accept only exact object-identity membership. It must not validate a symbol property, object shape, sequence number, string key, chart instance, element, logical range, model data, or lifecycle control method.

The host receives a receipt only through the callback below and echoes the same reference unchanged. `Reflect`-derived objects, object spread, `structuredClone`, JSON, persistence round trips, deserialization, cross-realm copies, and hand-made lookalikes are invalid even if TypeScript can be bypassed. No host clear/reset API exists; garbage collection may release private ledger entries only when the receipt itself is no longer referenced.

`PhaseOneMarketChartDataIdentityV1` is deliberately separate from the receipt. It is an immutable host input whose non-empty `key` identifies the exact data presentation the host believes it supplied. It is not a symbol, title, timeframe label, array reference, generated default, or inferred hash. The surface compares the command value to its current input value by exact value semantics; changing it invalidates pending work even if visible labels happen to match.

## 3. Surface props and ownership

`PhaseOneMarketChartSurface.svelte` must gain these optional props, alongside its existing props:

```ts
type Props = {
  // existing props remain source-compatible
  dataIdentity?: PhaseOneMarketChartDataIdentityV1;
  timeFocusCommand?: PhaseOneMarketChartTimeFocusCommandV1 | null;
  onMountLifecycleReceipt?: (receipt: PhaseOneMarketChartMountLifecycleReceiptV1) => void;
  onTimeFocusCompletion?: (completion: PhaseOneMarketChartTimeFocusCompletionV1) => void;
};
```

Rules:

1. A receipt identifies one **generation**. It rotates only on (a) component mount, (b) internal chart-instance replacement, or (c) an exact host `dataIdentity.key` change. It is issued once through `onMountLifecycleReceipt` after that generation is ready.
2. `dataIdentity` is a required fact for accepting a command, not a substitute for actual readiness. An omitted identity means no command can complete; a supplied identity with no usable active axis is `dataNotReady`.
3. The component is the only owner allowed to call its private `chart.timeScale().focusTime(...)`, publish a lifecycle completion, and mutate the viewport for this command. The host owns command generation, business intent, current data identity, and its handling of the emitted fact.
4. Existing markers remain a separate model projection. A time-focus command must not create, delete, alter, or infer markers. Markers do not certify a focus completion.
5. No public callback returns an internal chart API, canvas ref, DOM node, logical index, range, series ID, source ID, or imperative disposal handle.

The host has a matching responsibility: it **must change** `dataIdentity.key` before any axis dataset, window, revision, or content change that can alter `focusTime` resolution. Marker/status/readout changes, formatter/options changes, and equivalent model-object recreation without an axis content change do not rotate the generation. The surface may patch those ordinary presentation inputs without invalidating a valid current receipt.

For every new generation, the surface first completes model-axis application (`setData`/active-axis construction), the normal auto-fit decision, and receipt publication; only then may it consume a command for that receipt. A command must never race partially applied data or a later auto-fit.

## 4. Request validity and terminal union

The lifecycle layer has two independent outcome planes.

- `completed` means the command reached the existing focus resolver. Its `request` is the command's exact `focus` object and its `result` is the unmodified existing `PhaseOneTimeFocusResult`, including all five normal result variants: `exact`, `nearest`, `outOfDomain`, `ambiguous`, and `noData`.
- `rejected` means the lifecycle layer did **not** invoke `focusTime`. Rejections use only the frozen lifecycle reason union above; lifecycle errors must never relabel or compress an existing focus result.

Resolver eligibility requires a non-negative `Number.isSafeInteger(requestId)`, the active opaque receipt, a non-empty `expectedDataIdentity.key`, and a `focus` that satisfies the already-defined `focusTime` request validation. A malformed id is not correlatable and therefore publishes no completion; other malformed inputs with a safe id follow the frozen §5.1 priority and may publish `rejected/invalidRequest`, always with zero viewport mutation. Internal chart-axis invariant failures remain ChartX2 bugs: surface code must not convert them into normal lifecycle completions or silently recover with another range.

The emitted completion must echo the exact command `requestId` and the receipt that was checked. A `completed` fact carries the non-null data identity that actually passed every readiness and equality fence, plus the exact command `focus` and raw resolver result. A `rejected` fact instead carries `currentDataIdentity`: a shallow-frozen snapshot of the surface's actual current identity, or `null` if there is none. It must never substitute `expectedDataIdentity`, a prior identity, a generated key, or an inferred identity for that field. Completion objects are immutable facts; the surface must not later mutate or re-emit them.

## 5. Process-local terminal ledger and lifecycle fences

The terminal ledgers are module-private and process-local, not component-local: a `WeakSet` registers minted receipt objects; an exact-command-object `WeakMap` protects synchronous re-entry; and a `WeakMap<receipt, receiptLedger>` records object-receipt terminal `requestId`s plus the greatest terminal id. The ledgers remain available across component instances while their keys are referenced. There is no host clear/reset operation.

### 5.1 Malformed-command identity and priority (frozen)

There are deliberately **two private ledgers**, because valid command delivery and receipt trust are separate concerns.

1. For every command object with a non-negative `Number.isSafeInteger(requestId)`, a module-private `WeakMap` reserves that exact **command-object identity** as `inflight` before parsing its receipt or any other field. It becomes terminal before a host callback. Re-entering the same prop object therefore silently ignores it even when its receipt is `null`, primitive, forged, or otherwise malformed.
2. When `mountLifecycleReceipt` is object-valued, a second module-private `WeakMap<receipt, requestId ledger>` reserves the receipt/id pair before parsing/callback. This covers equivalent command objects, remount, and different surface instances. A forged object receipt participates in this dedupe ledger even though it never becomes trusted.

If `requestId` is malformed (negative, fractional, non-safe, `NaN`, missing, or a non-number), the surface must emit **no completion at all**: it cannot fabricate/coerce an id, reserve an invalid id, or create a terminal fact with false correlation. It must also never call `focusTime`.

For a safe non-negative id with a primitive, absent, or non-object receipt, only the exact command-object ledger is available. That object yields at most one `rejected/invalidRequest`; a distinct malformed command object may yield its own `invalidRequest`. The implementation must never claim pair-level lifecycle deduplication where no object receipt identity exists. A malformed command must never become an apparent `completed` fact.

For every command eligible for the first ledger, the following priority is frozen and is evaluated before any resolver side effect:

1. A previously `inflight` or terminal exact command object, or an already reserved/terminal object-receipt/id pair, is silently ignored.
2. Reserve the command object (and, when available, receipt/id pair) before parsing, callbacks, or any lifecycle effect.
3. An absent, primitive, forged, cloned, serialized, cross-realm, or otherwise unminted receipt yields exactly one `rejected/invalidRequest` under the available ledger(s).
4. A minted but foreign/noncurrent receipt yields exactly one `rejected/superseded`. Owning disposal alone yields exactly one `rejected/disposed`; a receiving surface's unrelated teardown never changes a foreign receipt into `disposed`.
5. For the active minted receipt, an id less than or equal to its greatest prior terminal id yields exactly one `rejected/staleRequest`.
6. An absent current identity or unavailable active chart/axis yields `rejected/dataNotReady`; then a current-vs-expected identity mismatch yields `rejected/dataIdentityMismatch`.
7. Only after the lifecycle/data fences, malformed command payload, `expectedDataIdentity`, or `focus` yields `rejected/invalidRequest`; a valid `focus` makes the single resolver call and `completed` terminal fact.

This ordering means an untrusted receipt never gains a lifecycle reason merely because another surface happens to have no data; absent current data truthfully wins over malformed focus; owning disposal has the stated owner-only priority; and a foreign minted receipt stays `superseded`, including when the receiving surface is itself unmounting.

1. The first safe-id terminal pair for a minted receipt may use any safe non-negative `requestId`.
2. For a current receipt, an unrecorded id less than or equal to the greatest terminal id receives exactly one `rejected/staleRequest`; it never reaches `focusTime`.
3. The exact command-object reservation occurs before parsing; every resulting terminal is recorded in the applicable ledgers before invoking the host callback. Any later occurrence of the same object or available `(receipt, requestId)` pair is silently ignored: no second completion, no focus call, no viewport/marker change, regardless of same-prop reactivity, callback re-entry, rebuild, remount, or a different component instance.
4. An old but minted, unconsumed receipt presented to a different current generation receives exactly one `rejected/superseded` and is then recorded. A later presentation of that pair is silently ignored. `superseded` is only for a foreign/noncurrent receipt or a command displaced before it can run; it is never a synonym for owning-lifecycle disposal.
5. On owning-lifecycle unmount, every current command that is pending but not terminal receives exactly one `rejected/disposed`, recorded before callback delivery. `disposed` takes precedence only in that owning unmount path. A later remount seeing that old terminal pair silently ignores it; it must not emit `superseded` or replay it.
6. Before calling `focusTime`, the surface snapshots receipt, identity, mounted state, chart instance, and command. After any await, microtask, animation-frame handoff, resize/rebuild boundary, or user callback re-entry, it re-checks them before a viewport mutation or callback. A stale snapshot has zero viewport mutation and follows the terminal rules above. “The Svelte effect already ran” is not a fence.

There is no automatic retry. The host issues a new strictly increasing command only after it receives a current receipt/current data identity it considers valid.

## 6. Data readiness, identity, and focus side effects

The surface must make the following decision before any focus side effect:

| Condition | Terminal fact | `focusTime` call | viewport mutation | marker mutation |
| --- | --- | ---:| ---:| ---:|
| owning lifecycle unmounts a current pending command | exactly one `rejected/disposed`, recorded before callback | 0 | 0 | 0 |
| already terminal `(receipt, requestId)` | silently ignore | 0 | 0 | 0 |
| current receipt has unrecorded stale/duplicate/non-monotonic id | exactly one `rejected/staleRequest` | 0 | 0 | 0 |
| minted but foreign/noncurrent receipt is first seen | exactly one `rejected/superseded` | 0 | 0 | 0 |
| forged/cloned/serialized/cross-realm/unregistered object receipt with safe id | exactly one `rejected/invalidRequest` per private receipt/id pair (and command object) | 0 | 0 | 0 |
| safe id with absent/non-object receipt | exactly one `rejected/invalidRequest` per exact command object; distinct malformed objects are not a receipt pair | 0 | 0 | 0 |
| malformed `requestId` | no completion and no resolver call; no fabricated correlation id | 0 | 0 | 0 |
| current identity absent or active chart/axis not ready | `rejected/dataNotReady` | 0 | 0 | 0 |
| identity differs from `expectedDataIdentity` | `rejected/dataIdentityMismatch` | 0 | 0 | 0 |
| malformed command or focus request | `rejected/invalidRequest` | 0 | 0 | 0 |
| all lifecycle checks pass | `completed` carrying raw `PhaseOneTimeFocusResult` | 1 | exactly the existing resolver behavior | 0 |

Existing focus behavior remains exact: `exact` and accepted `nearest` adjust only the time viewport once through the existing command; `outOfDomain`, `ambiguous`, and `noData` return their normal result and do not mutate it. The lifecycle seam must not auto-fit afterwards, call `setVisibleLogicalRange` a second time, alter price scale, persist a selection, update symbol/timeframe, or schedule a later corrective focus.

The current surface's normal model update can rebuild and auto-fit the chart. The implementation must order generation creation, axis application, auto-fit, receipt publication, and command consumption so ordinary rendering cannot produce a second mutation for a single command. A command is never implicitly carried across a generation rotation. In particular, “data refresh” is not an independent rotation condition: the host changes `dataIdentity.key` whenever that refresh changes axis content.

## 7. Alpha2 consumer rules (normative integration boundary)

Alpha2 first validates an exact DataX2 minute response and a unique bar. It converts that proven low-frequency bar key to ChartX2's numeric coordinate through `lowFrequencyTimeKeyToChartxCoordinate`, then sends `maxDistance: 0`. Alpha2 must not send a raw trade timestamp merely because it resembles a time coordinate.

On a received completion Alpha2 re-fences its request, receipt, project, `ResearchProjectChartTargetV1`, active view/base, context/query binding, source, timeframe/range, batch/run/trade/marker provenance, and current data identity. It accepts the business action only when all of the following are true:

```text
completion.kind === "completed"
completion.result.kind === "exact"
completion.request.time === completion.result.requestedTime
completion.request.time === completion.result.resolvedTime
```

Every rejection, stale completion, identity mismatch, result other than `exact`, or post-callback fence failure is zero Alpha2 viewport/persistence/owner-state side effect and no automatic retry. Alpha2 may render a user-facing explanatory state, but it must not leak ChartX2 lifecycle implementation fields as product facts.

## 8. Implementation shape and test gates

The future implementation may add a small public type module and a surface-local lifecycle coordinator. It must not add a second chart engine, alternate renderer, Alpha2-owned ref bridge, event bus, or a public raw chart API. `market-chart-surface.ts` owns the public model/types; `PhaseOneMarketChartSurface.svelte` composes them; `market.ts` re-exports them; `public/index.ts` remains the sole root delivery path.

Required focused tests:

1. root export/type probe imports all new V1 types from `@chartx2/library`, not an internal path;
2. receipt is a frozen private-factory token registered by exact object identity; `Reflect`, spread, `structuredClone`, JSON/persistence, cross-realm copies, and hand-made lookalikes fail runtime validation;
3. receipt rotates exactly on mount, internal chart-instance replacement, and `dataIdentity.key` change—never on marker/status/formatter/options/equivalent-model recreation; the host-content-change requirement is hostile-tested;
4. every generation completes axis `setData`/construction, auto-fit, and receipt publication before command consumption;
5. exact command calls `focusTime` once and emits one `completed` fact preserving the exact non-null current data identity, request, and result;
6. each preflight rejection reason is exhaustive, exposes only `currentDataIdentity: Identity | null` (never `expectedDataIdentity` as a fallback), and has zero focus/viewport/marker calls;
7. malformed-command tests freeze both ledger layers: safe id reserves an exact command object before parsing/re-entry; object receipts reserve a receipt/id pair even when forged; primitive/non-object receipts are deduped only for that exact command object; malformed ids emit no completion and never fabricate/correlate an id; all priority collisions follow §5.1;
8. process-local WeakMap ledger tests prove duplicate/backward id, same command reactivity, callback re-entry, scheduled replacement, rebuild, remount, and a different component instance give exactly one terminal per available valid pair and never replay;
9. unmount records pending current pairs as `disposed`; an old unconsumed minted receipt is `superseded` once; later old terminal pairs are silently ignored, with precedence hostile tests;
10. completed `nearest`, `outOfDomain`, `ambiguous`, and `noData` retain their existing distinct result kinds rather than becoming lifecycle rejections;
11. readiness/identity changes cannot permit an old command to mutate a new data set; marker fixtures prove focus neither adds nor changes markers;
12. a production-route browser test mounts the actual public Svelte surface and verifies visible focus/completion behavior. Browser test harnesses may seed/read only through a bridge; they do not prove native Tauri or DataX2 truth;
13. package gates run `pnpm check`, `pnpm test:unit`, and `pnpm release:local:check`, including a packed root-consumer proof for the callback/types.

Implementation/release is complete only after a fresh task-level review, a clean main release check, committed ChartX2 HEAD plus tgz SHA-512/SRI evidence, and an Alpha2 dependency-only install update. A source workspace link or a green browser fixture is not a release or native acceptance claim.

## 9. Explicit non-goals

- No change to existing `PhaseOneTimeFocusRequest`, `PhaseOneTimeFocusResult`, or imperative `focusTime` resolution semantics.
- No Alpha2 source, DataX2 contract, Rust/Tauri, CTP, broker, order/fill, report, or persistence change in this ChartX2 slice.
- No marker, trade overlay, selection, drawing, price-scale, layout persistence, replay playhead, or multi-chart capability.
- No claim that a package check, Browser route, release tarball, background process, or screenshot proves a visible native desktop task.
