# 0378 Extract Workbench Drawing Inspector Into The Library

Date: 2026-05-08

## Why

The drawing inspector had already collapsed into a schema-driven rendering shell inside `MarketWorkbenchPanel`, but it was still owned by the example host. That kept a reusable workbench primitive trapped behind host markup and hid another pocket of example-only card styling that would block a clean library-first surface.

## What Changed

- extracted the inspector into `packages/chartx2/src/lib/ui/WorkbenchDrawingInspectorPanel.svelte`
- kept the seam narrow by reusing the existing selected-drawing snapshot, field-value reader, field-update callback, and host-owned error map instead of inventing a broader controller surface
- exposed the panel through a focused `packages/chartx2/src/lib/public/workbench-drawing-inspector.ts` barrel and re-exported that seam from the root public index
- moved the inspector card and field styles into the library component so it no longer depends on `MarketWorkbenchPanel`-scoped CSS
- rewired `MarketWorkbenchPanel.svelte` to consume `WorkbenchDrawingInspectorPanel` from `@chartx2/library` while preserving the existing host-side validation and `applySelectedDrawingOptions(...)` path
- extended the package and consumer boundary tests to assert the new public export through both the focused barrel and the package root

## Result

- the drawing inspector UI is now library-owned instead of example-owned
- the public surface stays focused on one workbench primitive rather than widening host models or callback contracts
- the example host keeps its current selected-drawing behavior while the inspector becomes portable and self-contained

## Verification

- `pnpm --filter @chartx2/library exec vitest run tests/unit/public-index-contract.test.ts`
- `pnpm --filter @chartx2/example-tauri-svelte exec vitest run tests/unit/library-public-consumer.test.ts`
- `pnpm --filter @chartx2/example-tauri-svelte exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench exposes a drawing inspector driven by selected drawing schema|workbench object tree reflects indicators and drawings"`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
- `git diff --check`
