# alpha2 W4：chartx2 row-time focus public seam fresh task review

> Review target: `chartx2/main@00e6eeb7feea3e759be78889f216f4a2b2f1aeb4`
> Diff reviewed: `b4362000..00e6eeb`
> Review mode: fresh source, test, built-package and packed-consumer review
> Date: 2026-07-25

## Re-review of `13b5c57`

**GO**

```text
P0 = 0
P1 = 0
P2 = 0
```

`13b5c57` closes both findings without changing the chart seam, package exports,
or runtime owner chain:

- the temp consumer again imports `WorkbenchDrawingInspectorPanel` from
  `@chartx2/library/workbench-drawing-inspector` in both its `tsc` probe and
  Vite/Chromium runtime fixture, while retaining the root `ChartFrameShell`
  assertion;
- `PhaseOneTimeFocusResult` is now consumed through all five `kind` cases and
  a `never` default in the temp consumer's own type check;
- the focused negative proof is appropriate: removing the generated runtime
  subpath import makes the packed page fail before it can publish a probe
  result, then the restored import returns the verifier to GREEN;
- independently re-running `pnpm release:local:check` passed: workspace
  `pnpm check`, library `163` files / `572` tests, example `4` files / `16`
  tests, plus the fresh temp tgz Vite/Svelte/Chromium real-canvas consumer.
  `git diff --check b4362000..13b5c57` passes, `/tmp` has no consumer residue,
  and the generated artifact remains SHA-256
  `ed3dc752116b51ca5ae11c1fbbc30042395b38015d424acb3a533e9113cf9b4b` / SHA-512
  `d03227aa9c4cf620c40af29ef4dd42fba7ac03de43038eca5f2e74f986b6b919efe6a216eccbdc8733a0787a278ea39e90dea77772d70ccd007dc69e3f4b0e12`.

The final reviewed range `b4362000..13b5c57` remains limited to the planned
resolver, time-scale public types/owner wiring, focused tests, packed verifier,
and tutorials. It does not introduce logical/internal handles, marker/trade/
selection state, price/persistence behavior, alpha2 private integration, or
Tauri/Rust changes. The original NO-GO record is retained below for audit.

## Initial review verdict (historical)

**NO-GO — one release-boundary P1 and one package type-evidence P2 remain.**

```text
P0 = 0
P1 = 1
P2 = 1
```

The public API, resolver ownership and normal command behavior are otherwise
correctly narrow. The remaining findings are confined to the release verifier;
they need not broaden the chart seam or touch alpha2.

## What is correct

- `focusTime` is a required method of `PhaseOneTimeScaleApi`, with only generic
  numeric `time`/`maxDistance` inputs and five top-level result kinds. It is
  exported as a type through the package root; neither the pure resolver nor a
  logical index is exposed.
- `PhaseOneChartHarness → createChartScaleOwner → createTimeScaleApi` obtains a
  fresh `runtime.contextSnapshot().barSequence.axisBars` callback. The command
  snapshots that array once before resolving, rather than reading main raw data,
  DOM/canvas, markers, trade state or a stale fixture.
- `resolveTimeFocus` validates request and axis invariants before any result;
  then applies domain, bounded-nearest, accepted-candidate duplicate and
  padding precedence in the frozen order. Equal-distance resolution chooses the
  earlier row. `maxDistance: 0` is exact-only and equality at the bound is
  accepted.
- Successful resolution is the only path which applies time-scale options and
  renders. Rejected and validation/axis-failure paths return or throw before
  bar-spacing, right-offset, options or render calls. The new dependency surface
  has no price-scale, marker, trade, selection or persistence capability.
- The focused unit gate passed independently: `163` files / `572` tests. The
  full `pnpm release:local:check` also passed (both Svelte checks, the library
  and example unit suites, and the temp Vite/Chromium consumer). The consumer
  uses its own temp `node_modules`, installs Chromium there, uses HTTP plus a
  real canvas, closes browser/server in `finally`, and left no
  `/tmp/chartx2-release-consumer-*` directory.
- The generated tarball is the documented artifact: SHA-256
  `ed3dc752116b51ca5ae11c1fbbc30042395b38015d424acb3a533e9113cf9b4b` and
  SHA-512
  `d03227aa9c4cf620c40af29ef4dd42fba7ac03de43038eca5f2e74f986b6b919efe6a216eccbdc8733a0787a278ea39e90dea77772d70ccd007dc69e3f4b0e12`.
  `git diff --check b4362000..00e6eeb` passes; the worktree remains clean and
  the intended ahead-five relation is preserved.
- The tutorial records the requested clamp mutation: focused source unit and
  packed browser gate RED, then exact revert/GREEN. No mutation residue appears
  in the reviewed diff.

## P1-1 — the revised packed verifier drops an existing public subpath check

`scripts/verify-chartx2-local-release-consumer.mjs` previously installed and
loaded both the package root and the existing
`@chartx2/library/workbench-drawing-inspector` public subpath. This change
replaces those checks with only the root `ChartFrameShell` check. The package
still currently declares the inspector subpath, but the release verifier no
longer protects that established export.

That conflicts with the frozen release requirement that old exports remain
available. A tarball may pass this new focus probe while breaking the previous
consumer entrypoint, so the local release gate has regressed even though the
focus implementation itself is correct.

### Minimal fix

Keep the row-time browser scenario unchanged, but restore one temp-consumer
type import and one Vite/browser runtime import/assertion for
`WorkbenchDrawingInspectorPanel` from
`@chartx2/library/workbench-drawing-inspector`. This must resolve from the
packed tarball, not workspace source. Re-run `pnpm release:local:verify` (and
then the normal `release:local:check` closure) after the focused fix.

## P2-1 — the packed type probe does not exhaust the five result variants

The temp `type-probe.ts` names `PhaseOneTimeFocusResult`, but its only
`focusTime` implementation always returns `noData`; it never switches over all
five `kind` variants or asserts a `never` default. Runtime coverage does execute
exact, nearest, before-first, max-distance and no-data, but it does not replace
the planned consumer-side exhaustive type contract.

### Minimal fix

Add a small `switch (result.kind)` helper in the packed type probe with all
five cases and a `const impossible: never = result` default. Call it with the
`focusTime` result. This is type-only evidence and does not change the public
API or runtime behavior.

## Closure conditions

1. Fix P1-1 and P2-1 in a narrow follow-up commit with the next tutorial.
2. Freshly re-run the packed verifier and release check; retain the existing
   source/unit, clamp mutation and hash evidence if the resulting tarball hash
   is recomputed and recorded.
3. Re-review the release verifier. No alpha2 integration, Tauri/Rust, marker,
   price-scale, persistence or selection work is authorized by this review.
