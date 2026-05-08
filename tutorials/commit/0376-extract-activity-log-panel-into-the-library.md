# 0376 Extract Activity Log Panel Into The Library

Date: 2026-05-08

## Why

The workbench activity log had already collapsed into a thin, reusable bottom-panel primitive, but it still lived under the example app. That left the example shell owning library-shaped UI and kept the logs tab from using the same focused public seam as the other extracted bottom panels.

## What Changed

- moved `ActivityLogPanel.svelte` into `packages/chartx2/src/lib/ui`
- exposed the panel through `packages/chartx2/src/lib/public/workbench-bottom-panels.ts` so the logs tab stays grouped with the other workbench bottom-panel primitives
- moved the panel's own structural card/head styles into the library component so it no longer depends on example-only `mini-card` and `sidebar-head` CSS
- rewired `MarketWorkbenchPanel.svelte` to import `ActivityLogPanel` from `@chartx2/library`
- deleted the example-owned `ActivityLogPanel.svelte` after the example stopped referencing it
- extended the public index contract test to assert the new export through both the root barrel and the focused bottom-panel seam

## Result

- the activity log UI is now library-owned instead of example-owned
- the public seam stays narrow because the panel ships through the existing `workbench-bottom-panels` category rather than a generic host-shell bucket
- consumer behavior stays unchanged while the component becomes self-contained and portable

## Verification

- `rg -n "ActivityLogPanel|\\$lib/example-app/components/ActivityLogPanel|workbench-bottom-panels" /Users/dev/workspace2/hc_apps/chartx2`
- `pnpm --filter @chartx2/example-tauri-svelte exec vitest run examples/tauri-svelte/tests/unit/library-public-consumer.test.ts`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
- `git diff --check`
