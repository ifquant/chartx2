# 0353 add share summary card v5

## Why

The sharing seam already had a capable dialog, but host modules still had no
reusable way to show the current shared artifact outside dialog state. A thin
summary/card shell makes the sharing surface more library-like and easier for
other modules to embed directly.

## What changed

- extended the public share contract with a dedicated summary-card model
- added a reusable share artifact summary card component
- projected published share state into the summary card and mounted it in the
  workbench shell outside the dialog
- added focused visual coverage that the card survives dialog close and can
  reopen the shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "share dialog: published artifacts surface readonly permission status rows|share dialog: published artifacts project into a reusable summary card shell" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no artifact gallery, grid browser, or marketplace library view
- no backend summary aggregation or cross-user feed
