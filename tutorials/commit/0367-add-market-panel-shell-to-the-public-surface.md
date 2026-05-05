# 0367: Add a market-panel shell to the public surface

## Why

After moving the trading ledger shell back into `chartx2`, the next chart-adjacent UI still stranded in `alpha2` was the upper right market panel. The host already owned the state and fixture rows, but the tabbed ladder/profile shell still lived in the app repo.

That was another repeated chart-context UI that should belong to the library side.

## What changed

- added `market-panel-surface.ts` as a public typed model for ladder/profile market panel content
- added `MarketPanelShell.svelte` as a reusable host-facing shell component
- exported the new shell through the public component barrel and the new model through the main public barrel

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no live market-data adapter or engine runtime changed in this slice
- hosts still own market-panel state and callbacks; chartx2 only owns the public shell
