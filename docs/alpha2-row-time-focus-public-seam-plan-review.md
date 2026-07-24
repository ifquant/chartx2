# alpha2 W4：chartx2 row-time focus public seam fresh Sol-high plan review

> Review target: `docs/alpha2-row-time-focus-public-seam-plan.md`
> Observed HEAD: `73e8db376717619fae91502d74c440c8fa57f88b`
> Observed relation: `main...origin/main [ahead 3]`
> Review mode: source/plan/release-script static review only
> Date: 2026-07-25

## Re-review verdict

**GO**

```text
P0 = 0
P1 = 0
P2 = 0
```

Re-review target is the revised 544-line plan. The initial NO-GO and all original
findings remain preserved below as the review history.

The revision closes every blocker without expanding the seam:

| Initial finding | Revised contract | Re-review |
|---|---|---|
| unlimited nearest could cross an arbitrary gap | `maxDistance` is required; `0` is exact-only; positive values opt into inclusive bounded nearest; omitted/`undefined` fails validation | CLOSED |
| millisecond-specific API contradicted generic numeric chart time | public names are generic `time/resolvedTime/distance/maxDistance`; all use the active axis unit; alpha2 separately proves fill and curve values are both milliseconds | CLOSED |
| axis validity and result precedence were ambiguous | finite rows, strictly increasing logical indices, non-decreasing times, equal-time runs, safe padding, and a single 1–10 decision order are frozen | CLOSED |
| packed browser proof could accidentally exercise workspace source | temp consumer owns exact dependencies, tarball install, HTML/module fixture, Vite HTTP server, Chromium runner, real canvas, lifecycle cleanup, and the release gate | CLOSED |
| additive compatibility claim hid structural mock migration | runtime/call-site additive behavior is separated from the accepted pre-1.0 full-interface mock migration; `focusTime` remains required | CLOSED |
| thrown-path side effects were not command-level proof | the side-effect table and command/owner tests now cover request throws, invariant throws, all rejected results, and exact/nearest success counts | CLOSED |

### Final architecture adjudication

- `PhaseOneTimeScaleApi.focusTime` is the correct owner. Moving this command to
  `PhaseOneChartApi` would create a parallel chart-level seam for behavior already
  owned by the time scale.
- `ChartModel.context().snapshot().barSequence.axisBars` remains the only correct
  active time-axis authority. It supports current multi-pane sharing and leaves
  future multi-source composition with `ChartModel`.
- The five normal kinds are mutually exclusive under the revised valid-axis
  contract. Request and internal-invariant violations remain exceptions before
  mutation rather than being disguised as a sixth product result.
- `maxDistance` is now a caller-owned policy rather than a chartx2 guess. This is
  essential because chartx2 does not own timeframe, session breaks, sampling, or
  alpha2 product meaning.
- Exact/nearest success has one time-scale application and one render. Every
  throw/reject path has zero viewport/render mutation. Price, marker, trade,
  source, persistence, selection, and event state remain outside the seam.
- No public logical range/index, registry handle, pane/source identity, canvas,
  renderer, alpha2 ID, event bus, or selection state leaks through the result.
- Duplicate ambiguity is correctly retained as a fail-closed resolver contract
  even though ordinary public time-based `setData` rejects duplicates. Packed
  browser proof need not manufacture an invalid public main series; source unit
  proof owns that branch.
- The packed proof is now materially stronger than an export or SSR smoke: it
  loads the built tarball from the temp consumer's own package root and exercises
  a browser canvas through HTTP.

### Verification adjudication

The planned evidence is sufficient and proportionate:

1. pure resolver tests own five-state resolution, axis invariants, equal-time
   runs, threshold precedence, safe padding, empty/single-bar, and invalid input;
2. command/owner tests own apply/render counts and thrown/rejected zero side
   effects;
3. public/type/dist tests own required interface and barrel shape;
4. the temp tarball consumer owns exhaustive type usage plus real browser
   runtime;
5. the clamp mutation must independently make both the focused source unit gate
   and repacked browser consumer gate RED, then both GREEN after exact revert;
6. `release:local:verify`, `release:local:check`, hashes, tutorial, commit, fresh
   Terra-high review, and double push close delivery.

Implementation should not add price or persistence dependencies to
`createTimeScaleApi` merely to create spies. Command spies should prove every
reachable time-axis/render call count; owner/harness tests and the committed
scope/diff prove that no price or persistence route was introduced. This is an
execution clarification, not a remaining plan finding.

### Final scope decision

Proceed with the revised plan as one chartx2 seam and one coherent implementation
commit:

```text
feat(chartx2-time-scale): add public row-time focus
```

This plan-freeze commit occupies tutorial `0393`; keep tutorial `0394` for implementation,
use Terra high for implementation, then a fresh Terra-high
task review. Review fixes, if any, remain narrow independent commits with the next
tutorial number. Push only after implementation review reaches P0=P1=P2=0.

This GO does not authorize selection/event/strategy APIs, multi-chart/source
selectors, marker creation, alpha2 private integration, Tauri/Rust/DataX2 work,
or any rewrite of the three existing ahead commits.

---

## Initial verdict (preserved)

**NO-GO**

```text
P0 = 0
P1 = 4
P2 = 2
```

The seam is necessary, and its ownership is mostly right. `locateTrade` is not a
valid substitute for one canonical fill: the current request requires a complete
trade, the resolver derives both time and price ranges, and the runtime owns an
active trade-location session. `chart.timeScale().focusTime(...)` is also the
right public object location: this operation reads the chart-wide time axis and
changes only the time viewport. Moving it to the top-level chart API would weaken
the current object model without solving a real boundary problem.

`ChartModel`'s `barSequence.axisBars` is the correct current authority. It is
chart-wide, shared by panes, and already differs appropriately across projected,
compressed, and direction-column price-based sequences. The plan also correctly
keeps logical indices, renderer state, source registry handles, markers, product
selection, and alpha2 IDs private.

However, the current plan still allows four materially different implementations:

1. unlimited nearest versus bounded nearest;
2. millisecond-specific public time versus the existing generic numeric chart-time
   contract;
3. duplicate ambiguity versus invalid/unordered axis and max-distance precedence;
4. a real packed browser gate versus a probe that cannot actually launch the
   described browser consumer.

These must be frozen before Terra-high implementation. No source change should
start from the current version of the plan.

## What is already correct

### `locateTrade` is conclusively the wrong seam

The plan's rejection of `locateTrade` is supported by current source:

- `PhaseOneTradeLocationRequest` contains trade ID, symbol, entry/exit time,
  entry/exit price, side, quantity, and realized PnL.
- `resolveTradeLocationState(...)` independently resolves entry and exit rows,
  calculates a padded logical range and a padded price range, and returns overlay
  state.
- the runtime stores an active trade-location session and refreshes it when source
  data changes.

A one-fill adapter would therefore invent missing trade facts, alter price state,
and create persistent overlay semantics that W4 does not own.

### The method belongs on `PhaseOneTimeScaleApi`

Current public shape is:

```text
PhaseOneChartApi.timeScale()
  → PhaseOneTimeScaleApi
     → get/set visible logical range
     → apply time-scale options
```

Current owner flow is:

```text
PhaseOneChartHarness
  → createChartScaleOwner
  → createTimeScaleApi
  → TimeScale
```

`focusTime` is a time-domain resolution plus viewport command. It is not chart
selection, marker creation, trade location, or source switching. Adding it to
`PhaseOneTimeScaleApi` preserves the object model and future multi-pane behavior.

### `axisBars` is the right authority

`ChartBarSequence.axisBars` is already the active axis representation:

- time-based sequences use the chart rows directly;
- projected price-based sequences keep input-time axis rows while projecting
  generated bars between them;
- compressed price-based sequences use the generated rows;
- direction-column sequences select one axis row per logical column.

This is exactly the place where future `ChartModel` multi-source composition can
remain authoritative. The host must not receive `logical`, pane IDs, source IDs,
or a resolver handle.

### The result surface is appropriately small

Five normal result kinds are sufficient:

```text
exact | nearest | outOfDomain | ambiguous | noData
```

They can remain top-level discriminants. No event bus, selection object,
persisted focus state, strategy API, or sixth product result is needed.

## P1 findings

### P1-1 — omitted `maxDistance` currently permits misleading focus across an arbitrary gap

The plan says omitted `maxDistanceMs` means unlimited nearest, and the alpha2
example omits the field. That means any requested time inside `[first,last]` can
focus a row even if the nearest actual axis point is hours, days, or weeks away.

This is not just a taste issue. W4 will report a selected canonical fill and a
focused performance point. Across a session break, missing curve segment, sparse
downsample, or partial historical window, unlimited nearest can make the UI imply
that a distant point represents the selected fill.

The chart library cannot infer a safe threshold because it does not own the
timeframe, session calendar, curve sampling policy, or product meaning. Therefore
the default must not be unbounded.

#### Minimal required revision

Make the caller provide the nearest tolerance:

```ts
type PhaseOneTimeFocusRequest = {
  time: number;
  maxDistance: number;
  paddingBeforeBars?: number;
  paddingAfterBars?: number;
};
```

`maxDistance = 0` means exact-only. A positive value permits nearest resolution
within that inclusive distance. Alpha2 must derive and pass an explicit
curve/timeframe-aware bound; chartx2 must not guess it.

If optional syntax is retained, omitted must behave as `0`, not infinity. In that
case the type and docs must state that nearest is opt-in.

Required tests:

- omitted/zero exact succeeds;
- omitted/zero in-between request returns `maxDistanceExceeded`;
- equal threshold succeeds;
- greater-than threshold fails with zero viewport/render side effects;
- a large internal gap does not focus without explicit caller tolerance.

### P1-2 — the millisecond-specific names contradict the existing public chart-time contract

The plan uses `timestampMs`, `requestedTimeMs`, `resolvedTimeMs`,
`distanceMs`, and `maxDistanceMs`, while explicitly saying it will not change
the existing series data contract.

Current public chart data is `time: number`, not a branded Unix-millisecond type.
The internal generic `ChartTime` even supports `number | string | Date`; the
phase-one public API narrows series time to `number`, but does not standardize
that number as milliseconds. Current examples commonly use `Date.UTC(...)`, but
example convention is not a package contract.

A generic chart time-scale API must compare values in the active axis's numeric
time domain. Giving only the new command millisecond-specific names would create
an API that looks unit-safe while runtime cannot verify that the axis was loaded
in milliseconds.

#### Minimal required revision

Use names aligned with the existing public axis:

```ts
type PhaseOneTimeFocusRequest = {
  time: number;
  maxDistance: number;
  paddingBeforeBars?: number;
  paddingAfterBars?: number;
};

type PhaseOneTimeFocusResult =
  | { kind: "exact"; requestedTime: number; resolvedTime: number; distance: 0 }
  | { kind: "nearest"; requestedTime: number; resolvedTime: number; distance: number }
  | {
      kind: "outOfDomain";
      requestedTime: number;
      reason: "beforeFirst" | "afterLast" | "maxDistanceExceeded";
    }
  | { kind: "ambiguous"; requestedTime: number; resolvedTime: number }
  | { kind: "noData"; requestedTime: number };
```

Document that `time`, `resolvedTime`, `distance`, and `maxDistance` all use the
same numeric unit as the active chart axis. Alpha2 may pass
`canonicalFill.ts_ms` only because the W4 performance curve is also loaded with
millisecond values. Add one alpha2-side assertion/test for that matching-unit
contract.

The alternative—standardizing every numeric phase-one chart time as Unix
milliseconds—is a broader public-contract migration and is outside this seam.

### P1-3 — the resolver lacks a frozen axis invariant and an unambiguous decision order

The plan requires binary-search-style adjacent resolution and duplicate
detection, but does not state the internal preconditions that make that algorithm
valid.

Current time-based `setData` rejects duplicate or decreasing adjacent values, so
ordinary time-based `axisBars` cannot contain duplicates. Price-based builders,
however, construct axis sequences through several different paths. Compressed and
direction-column sequences can expose generated numeric times; future composed
axes may also introduce duplicate timestamps intentionally. Thus an
`ambiguous` branch is a useful fail-closed future guard, but it is not the common
current state and must not substitute for validating the axis itself.

The current five states are also not fully mutually exclusive as written:

- a nearest candidate can be duplicated;
- the same candidate can exceed `maxDistance`;
- a malformed axis can be empty-looking, unordered, non-finite, or have invalid
  logical indices.

Without a fixed precedence, one implementation can return `ambiguous` before
checking distance while another returns `maxDistanceExceeded`. A binary search
over unordered/non-finite rows can return an arbitrary normal result.

#### Minimal required revision

Freeze two domains:

Normal public domain:

```text
valid request + valid axis
  → exact | nearest | outOfDomain | ambiguous | noData
```

Internal invariant domain:

```text
non-empty axis requires:
- every time finite
- every logical index finite
- logical indices strictly increase
- times are non-decreasing
```

An invariant violation must throw/assert before any viewport mutation or render;
it must not be converted to `noData`, nearest, or another invented fallback.

Freeze the normal decision order:

```text
1. validate request
2. snapshot and validate axis invariant
3. empty → noData
4. before/after chart domain → outOfDomain
5. resolve exact or lower/upper nearest candidate; tie → earlier time
6. for non-exact candidate, distance > maxDistance → maxDistanceExceeded
7. scan the complete equal-time run for the accepted candidate
8. duplicate accepted candidate → ambiguous
9. unique candidate → exact/nearest and compute range
10. perform one viewport application and one render
```

This ordering makes the five states mutually exclusive. It also means a duplicated
candidate outside caller tolerance is simply outside the request's focus domain;
ambiguity matters only for a candidate that would otherwise be accepted.

Add pure tests for:

- non-finite time/index;
- decreasing time;
- non-increasing logical index;
- a duplicate run at first, middle, and last positions;
- duplicated nearest candidate below/equal/above the distance threshold;
- invariant errors have zero command side effects.

Padding values should use `Number.isSafeInteger`, not merely
`Number.isInteger`, because they are bar counts and later participate in range
arithmetic.

### P1-4 — the packed browser proof is not yet an executable gate

The intended evidence is correct: build the tarball, install it in a temp consumer,
type-check root imports, and run the real packaged runtime in a browser canvas.
The current release verifier, however, only:

- writes a temp package without Playwright;
- starts Vite in SSR middleware mode;
- uses `ssrLoadModule(...)`;
- runs a TypeScript probe.

It does not start an HTTP server, launch a browser, or mount a real canvas. The
plan says to “reuse example installed Playwright browser runner,” but does not
specify how a spec executed from the example avoids resolving its
`workspace:*` chartx2 dependency instead of the temp consumer's tarball.

That ambiguity is especially important because the mutation section requires the
packed runtime probe itself to turn RED. A source-backed example spec could pass
or fail for the wrong package.

#### Minimal required revision

Freeze the verifier as one self-contained temp-consumer gate:

1. temp `package.json` installs the generated tarball and an exact Playwright
   runner version;
2. temp consumer writes an HTML/module fixture importing only
   `@chartx2/library` from its own `node_modules`;
3. temp consumer starts a Vite HTTP server;
4. Playwright launches Chromium, navigates to that server, mounts a real canvas,
   creates a chart, loads known rows, calls `focusTime`, checks the five-state
   representatives needed by the gate, and destroys the chart;
5. the verifier closes browser/server in `finally` and deletes the temp tree;
6. `pnpm release:local:verify` invokes this exact flow, so
   `pnpm release:local:check` cannot pass without it.

The runtime assertion must compare viewport state before/after each rejected
call, not merely inspect the returned kind. It must prove at least:

- bounded nearest succeeds;
- before-first is rejected and range unchanged;
- max-distance exceeded is rejected and range unchanged;
- package root runtime import works;
- old representative exports remain available.

The mutation command must be named explicitly:

```text
mutate source guard
→ pnpm --filter @chartx2/library test:unit  # RED
→ pnpm release:local:verify                # RED from packed browser
→ revert exact mutation
→ rerun both                               # GREEN
→ git diff --check and targeted diff       # no mutation residue
```

No screenshot or full visual suite is required.

## P2 findings

### P2-1 — “additive/backward compatible” needs a precise source-compatibility statement

Runtime behavior is additive and old time-scale methods remain unchanged.
However, adding a required method to `PhaseOneTimeScaleApi` is source-breaking
for consumers that structurally implement or mock the full interface. The plan
already requires internal mocks to add `focusTime`, which demonstrates this
effect.

Do not make the method optional. Instead, revise the claim:

```text
- runtime and call-site usage are additive;
- old chart/time-scale methods retain behavior;
- full structural PhaseOneTimeScaleApi implementations/mocks must add focusTime;
- package remains pre-1.0 and this source-level test-double migration is accepted.
```

Add a packed type probe that constructs or `satisfies` the complete
`PhaseOneTimeScaleApi`; that catches declaration drift without pretending no
source migration exists.

### P2-2 — failure-side-effect evidence should explicitly include thrown validation/invariant paths

The command/owner section says “failure 0/0,” but the pure test list says
“invalid request no action,” even though the pure resolver itself has no viewport
action to observe.

Move side-effect proof to the command layer and enumerate:

- invalid request throws with 0 axis mutation, 0 time-scale option application,
  0 render;
- invalid axis invariant throws with the same 0/0/0 result;
- `outOfDomain`, `ambiguous`, and `noData` return with the same 0/0/0 result;
- `exact` and accepted `nearest` perform exactly one time-scale application and
  one render;
- price-range owner and persistence/snapshot paths are never called.

This is a focused test correction, not a new analyzer or mutation sweep.

## Required plan edits before GO

The plan can remain one seam and one implementation commit. It does not need a
larger selection/event/strategy design. Revise only:

1. make nearest tolerance explicit and safe by default;
2. use the active axis's generic numeric time unit, with alpha2 proving its curve
   and canonical fills both use milliseconds;
3. freeze axis invariants and exact result precedence;
4. make the packed browser consumer an executable temp-consumer gate;
5. state source compatibility honestly;
6. move thrown-path side-effect proof to the command layer.

After those edits, retain:

- `PhaseOneTimeScaleApi.focusTime`;
- `ChartModel.context().barSequence.axisBars` authority;
- five top-level result kinds;
- earlier-time tie break;
- padding after accepted resolution;
- zero side effects for every non-success result;
- no logical/internal leakage;
- one implementation commit, tutorial `0394`, fresh Terra-high review, narrow
  fix commits only if required, and double push after P0=P1=P2=0.

## Baseline and process evidence

Current observations match the plan:

```text
HEAD = 73e8db376717619fae91502d74c440c8fa57f88b
branch relation = main...origin/main [ahead 3]
latest tutorial before this plan freeze = 0392-add-market-chart-host-controls.md
this plan freeze = 0393-freeze-row-time-focus-public-seam-plan.md
planned implementation tutorial = 0394-add-row-time-focus-public-seam.md
```

The existing tarball hashes and alpha2 lock integrity were also rechecked and
match the plan:

```text
SHA256
65ec82e205e73f99c7f47980aaa23eb494ec939e9ba615c111f9454ae8800f32

SHA512(hex)
7115821148576a7d11c40c9781de886f6482abfead07a9484ea3b249d41a39a438b7dbfbb77eb4a95e1db1abbf92b31142bc2bb786f3a818ecba40bdb9007023

alpha2 lock integrity
sha512-cRWCEUhXan0RxAyXgd6Ib2SCq/6tB6lITqOySdQaOaQ4t9v7t360qV4dsau/krMRQrwrt4bzqBjsukC9uQBwIw==
```

These are baseline-only artifacts and still do not prove the new seam.

No code, plan, commit, history, tarball, or release artifact was changed by this
review. The only intended write is this review document.

## GO criteria for re-review

Fresh re-review can return GO when the revised plan unambiguously proves:

1. `focusTime` remains time-scale-owned;
2. `axisBars` remains the only active-axis authority;
3. time units match the existing public chart-time model;
4. nearest cannot silently cross an unbounded gap;
5. all five normal results are mutually exclusive under a stated valid-axis
   invariant;
6. every rejected/throwing path has zero viewport/render/price/persistence side
   effects;
7. packed root types and real browser runtime both execute from the temp tarball
   consumer;
8. the actual mutation makes both focused source tests and the packed browser
   gate RED before exact revert;
9. tutorial `0394`, one coherent implementation commit, fresh Terra-high review,
   and double push remain unchanged.

Until then:

```text
chartx2 seam plan NO-GO
alpha2 W4 Commit B must not bypass the package boundary
```
