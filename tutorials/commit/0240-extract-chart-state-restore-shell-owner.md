# 0240 Extract Chart State Restore Shell Owner

## Why This Commit Exists

After the earlier state-shell extraction, `chart-harness` still carried one large inline adapter object for restore commands.

That block was not restore logic itself, but it still assembled a high-fanout group of runtime callbacks:

- pane rebuild and pane event wiring
- series and study restore adders
- trade-location restore wiring
- scale restore wiring
- final render trigger wiring

So even though restore algorithms already lived in shared modules, the harness still owned too much restore composition.

## What Changed

- Added `chart-state-restore-shell-owner.ts` as a focused adapter-shell owner for restore command assembly.
- Rewired `chart-harness.ts` so `chart-state-shell-owner` now receives restore commands from the restore shell owner instead of an inline harness-local object.
- Added `chart-state-restore-shell-owner.test.ts` as a focused regression test for the new composition surface.
- Updated the architecture note to record restore command assembly as its own adapter-shell responsibility.

## Why This Is Safe

This does not change chart-state restore order, pane validation semantics, drawing restore behavior, or any public API contract.

The existing restore command owner and state coordinator still own the actual behavior. This commit only moves the command wiring behind one narrower shell surface so `chart-harness` keeps shrinking toward a composition root.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-state-restore-shell-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-state-shell-owner.test.ts`

## Not Included

- Restore algorithms are unchanged.
- Public state/template APIs are unchanged.
- This still does not collapse the entire public adapter surface; it only removes the restore command bundle from `chart-harness`.
