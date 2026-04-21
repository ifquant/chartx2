# 0233 Move Pane Geometry Defaults

## Why This Commit Exists

After default option extraction, two pane geometry constants still lived in `chart-harness`: `PANE_GAP` and `PANE_DIVIDER_HIT_SLOP`.

That split default ownership across the harness and the default-options module. This small follow-up makes the boundary consistent.

## What Changed

- Moved pane gap and pane divider hit slop constants into `chart-default-options.ts`.
- Rewired `chart-harness` to import those constants.
- Extended default-options coverage to pin the pane geometry defaults.

## Why This Is Safe

The numeric values are unchanged. This only changes where the constants are defined.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-default-options`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Public `PhaseOne*` API types still live in `chart-harness`.
- No pane resize, hit testing, or layout behavior is intentionally changed.
