# 0241 Extract Chart Public Shell Owner

## Why This Commit Exists

Even after the earlier public surface extraction, `chart-harness` still owned one more adapter-shell composition block for the public API handoff.

That block was not implementing public behavior itself, but it was still assembling the stable owner bundle that feeds the public facade:

- series command routing
- drawing command and selected-drawing state routing
- pane command routing
- state/template/trade/public lifecycle handoff

So the harness was still carrying another dependency bundle that belonged in shell composition, not in the runtime adapter body.

## What Changed

- Added `chart-public-shell-owner.ts` as a focused shell owner over public-surface composition.
- Rewired `chart-harness.ts` to use the new public shell owner instead of constructing `chart-public-surface-owner` inline.
- Added `chart-public-shell-owner.test.ts` as a focused regression test for the public handoff shell.
- Updated the architecture note to record public API handoff as its own adapter-shell responsibility.

## Why This Is Safe

This does not change the external `PhaseOneChartApi` contract or the behavior of the underlying public surface.

The existing `chart-public-surface-owner` still owns the actual facade wiring. This commit only moves one more composition block out of `chart-harness` so the harness remains closer to a thin composition root.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-public-shell-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-public-surface-owner.test.ts`

## Not Included

- No public API methods are added, removed, or renamed.
- Public runtime semantics are unchanged.
- This still does not collapse factory/demo handoff; it only removes the public handoff dependency bundle from `chart-harness`.
