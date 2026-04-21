# 0228 Extract Interaction Owner

## Why This Commit Exists

`chart-harness` was still directly assembling the full pointer, wheel, click, keyboard, drawing, and pane-resize dependency bundle for `createChartInteractionHandlers`.

That made the harness responsible for too much interaction policy plumbing even after the lower-level interaction runtime had already been extracted.

This slice adds a composition owner between the harness and the interaction handler factory. The behavior stays the same, but the harness now hands stable owners and state objects to a narrow interaction boundary instead of wiring every small closure inline.

## What Changed

- Added `chart-interaction-owner.ts` as the composition layer for interaction handlers.
- Moved view-state mutation, drawing hit/drag routing, pane resize routing, selected-drawing keyboard routing, readout building, and click publication wiring behind that owner.
- Rewired `chart-harness` to call `createChartInteractionOwner`.
- Added focused unit coverage for click selection/publication and selected-drawing delete routing.
- Updated the architecture note to record the interaction-owner boundary.

## Why This Is Safe

The new owner delegates to the existing `createChartInteractionHandlers` leaf factory. It does not change pointer math, hit testing, wheel zoom, keyboard behavior, pane resize semantics, drawing drag geometry, or readout assembly.

The harness still owns the actual runtime state and passes the same underlying owners through. This is a composition-boundary change, not an interaction behavior rewrite.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-interaction-owner chart-interaction-handlers`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Pointer hit behavior is unchanged.
- Drawing snap/magnet rendering is unchanged.
- Canvas lifecycle attach/detach still receives handler methods from `chart-harness`.
- Public API passthrough cleanup remains a later adapter-shell slice.
