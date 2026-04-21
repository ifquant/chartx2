# 0212 - Move Pane Commands To Owner

This slice moves public pane command composition into `chart-pane-owner`.

Before this change, the harness still assembled `panesApi`, `addPane`, and `removePaneByHandle` directly. The lower-level pane owner already owned pane handles, pane lookup, resize, options, removal guards, event publication, and pane state snapshots, so keeping public pane commands in the harness was redundant.

## What Changed

- Added `listPaneHandles`, `addPane`, and `removePaneByHandle` to `chart-pane-owner`.
- Routed `chart-harness` pane public methods through the pane owner.
- Changed pane target resolution to create missing secondary panes through the same owner command path.
- Extended pane owner tests to cover pane list handles, add events, and handle-based removal.

## Why This Shape

Pane add/remove behavior has side effects beyond mutating the pane collection: pane events, render invalidation, handle registration, removal guards, and secondary-scale cleanup all have to stay aligned. Keeping those command paths in the owner prevents the harness from becoming a second pane runtime policy layer.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-pane-owner chart-pane-runtime chart-pane-management`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

