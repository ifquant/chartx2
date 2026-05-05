# 0366: Add a public trading-ledger panel shell

## Why

`alpha2` had already pushed its bottom trading ledger into a host-runtime model, but the ledger UI itself still lived in the app repo. That blurred the boundary: the runtime was host-owned, yet the chart-adjacent shell was still a local app implementation.

To keep `chartx2` as the reusable chart/workbench UI library, the ledger shell itself needed to move back into the public surface.

## What changed

- added `trading-ledger-surface.ts` as a public typed model for tabbed ledger rows plus selected-row detail fields
- added `TradingLedgerPanel.svelte` as a reusable host-facing shell component
- exported the new panel through `host-shell-components.ts`
- exported the new model through the main public barrel

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no engine runtime or trading adapter behavior changed in this slice
- no host-side persistence logic moved into `chartx2`; hosts still own ledger state and callbacks
