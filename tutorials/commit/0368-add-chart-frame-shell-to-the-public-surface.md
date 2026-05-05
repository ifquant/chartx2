# 0368: Add chart frame shell to the public surface

Date: 2026-05-05

## Why

`alpha2` still owned the left draw-tool rail and chart-head chips even after
the ledger and market shells had already moved back into `chartx2`. That kept a
piece of clearly chart-adjacent workstation chrome in the host app instead of
in the chart library.

## What changed

- added `chart-frame-surface.ts` with typed tool/chip/frame models
- added public `ChartFrameShell.svelte` for the draw-tool rail, chart-head, and
  chart content slot
- exported the new shell through `host-shell-components.ts` and the top-level
  public barrel
- updated the alignment plan to note that chart-frame chrome is now part of the
  reusable host-facing library surface

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no real drawing runtime or tool behavior was added; tool actions remain
  host-owned
- no chart engine integration was added beyond the shell slot and typed model
