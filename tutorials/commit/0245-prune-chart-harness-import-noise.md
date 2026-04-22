# 0245 Prune Chart Harness Import Noise

## Why This Commit Exists

After the entry/export cleanup, `chart-harness.ts` had the right responsibility boundary, but it still carried a large amount of stale import residue from earlier extraction phases.

Those imports were no longer part of the actual composition root. They were just historical leftovers that made the file look denser and less trustworthy than it really was.

## What Changed

- Removed no-longer-used model, drawing, template, render, and public-type imports from `chart-harness.ts`.
- Kept the runtime wiring unchanged; this is only a cleanup of stale dependencies that no longer participate in harness composition.
- Updated the architecture note to record that the composition root should keep shedding stale leaf imports once compatibility layers are gone.

## Why This Is Safe

This does not change chart behavior, state wiring, rendering behavior, or public API behavior.

The cleanup only removes imports that are no longer referenced by the harness implementation. The runtime object graph is unchanged.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench opens by default and renders the baseline chart"`

## Not Included

- No new extraction owner is introduced here.
- No runtime composition wiring is changed.
- This does not yet split the harness class itself into multiple files; it only leaves the current composition root in a cleaner final state.
