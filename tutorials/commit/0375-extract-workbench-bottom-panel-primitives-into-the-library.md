# 0375 Extract Workbench Bottom Panel Primitives Into The Library

Date: 2026-05-08

## Why

The workbench replay and time-preset panels had stabilized into reusable UI, but they still lived under the example app. That kept the library-first split incomplete and forced the example workbench shell to depend on example-owned bottom-panel components.

## What Changed

- moved `ReplayPanel.svelte` and `TimePresetsPanel.svelte` into `packages/chartx2/src/lib/ui`
- added a focused `WorkbenchReplayPanelModel` contract under the public workbench surface so the replay panel no longer depends on `DemoReplayState`
- exposed the extracted panels through a dedicated `workbench-bottom-panels` public barrel instead of folding them into the host-shell export bucket
- rewired `MarketWorkbenchPanel.svelte` to import both panels from `@chartx2/library`
- deleted the old example-owned panel files once the example stopped importing them

## Result

- the stable bottom-panel primitives are now library-owned and reusable outside the example app
- replay UI depends on a narrow library contract instead of an example runtime type
- behavior and styling stay aligned because the moved components keep the same markup, class names, and panel-local CSS

## Verification

- `rg -n "ReplayPanel\\.svelte|TimePresetsPanel\\.svelte|DemoReplayState|\\$lib/example-app/components/ReplayPanel|\\$lib/example-app/components/TimePresetsPanel" /Users/dev/workspace2/hc_apps/chartx2`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
- `git diff --check`
