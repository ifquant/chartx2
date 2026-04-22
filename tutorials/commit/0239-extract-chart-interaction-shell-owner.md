# 0239 Extract Chart Interaction Shell Owner

## Why This Commit Exists

`chart-harness` had already pushed interaction logic into `chart-interaction-owner` and canvas attach/detach into `chart-canvas-lifecycle-owner`, but the harness still had to assemble both pieces inline.

That kept one more high-fanout shell block in the adapter layer:

- interaction handler construction
- canvas lifecycle wiring
- attach/detach cleanup routing

The business logic was already elsewhere, but the composition root was still too noisy.

## What Changed

- Added `chart-interaction-shell-owner.ts` as a focused composition owner over interaction runtime plus canvas lifecycle.
- Rewired `chart-harness.ts` to use the shell owner for `attach(...)` and teardown instead of assembling those dependencies inline.
- Added `chart-interaction-shell-owner.test.ts` to cover attach/detach composition behavior and lifecycle cleanup.
- Updated the architecture note to record interaction shell composition as another adapter-shell responsibility that no longer belongs in the harness body.

## Why This Is Safe

This does not change pointer behavior, keyboard shortcuts, pane resize semantics, or drawing drag logic.

The existing interaction and canvas lifecycle modules still own the actual runtime behavior. This commit only moves their assembly behind one narrower shell interface so `chart-harness` keeps collapsing toward a composition root.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-interaction-shell-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

## Not Included

- Interaction algorithms and event semantics are unchanged.
- Public API surface and render coordinator wiring are unchanged.
- This does not yet remove the remaining restore/public adapter-shell composition from `chart-harness`.
