# 0377 Extract Workbench Workspace Tab Strip Into The Library

Date: 2026-05-08

## Why

The workbench workspace tab strip had already settled into a reusable library-shaped UI, but it still lived inline inside the example app shell. That left a core workbench primitive owned by the host example and hid a CSS dependency that would keep resurfacing in follow-up seam-fix slices.

## What Changed

- extracted the workspace tab strip into `packages/chartx2/src/lib/ui/WorkbenchWorkspaceTabStrip.svelte`
- kept the seam narrow by reusing `WorkbenchWorkspaceTabModel` plus the existing select, close, and create intents instead of adding a broader host-facing model
- exposed the component through a focused `packages/chartx2/src/lib/public/workbench-workspace-tabs.ts` barrel and re-exported that seam from the root public index
- moved the strip's structural styles and mobile detail-collapse rules into the library component so it no longer depends on hidden example-host CSS
- rewired `MarketWorkbenchPanel.svelte` to consume `WorkbenchWorkspaceTabStrip` from `@chartx2/library` while preserving the existing mobile-sheet side effects in the example-owned callbacks
- extended the package and consumer boundary tests to assert the new public export through both the focused barrel and the real package import path

## Result

- the workspace tab strip is now library-owned instead of example-owned
- the public surface stays semantically clean because the component ships through a workbench-specific seam rather than a generic host-shell bucket
- test-facing data attributes and user-facing behavior remain aligned while the extracted component becomes self-contained

## Verification

- `rg -n "WorkbenchWorkspaceTabStrip|workbench-workspace-tabs|data-workspace-tab" /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/tests/unit /Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/lib/example-app/components /Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/tests/unit`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
- `git diff --check`
