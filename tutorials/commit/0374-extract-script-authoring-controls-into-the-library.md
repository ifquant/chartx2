# 0374 Extract Script Authoring Controls Into The Library

Date: 2026-05-08

## Why

The custom-script builder controls in the official example app had stabilized into reusable workbench UI, but they still lived under `examples/`. That left the library/example split incomplete and forced the host panel to reach into example-owned components for script authoring.

## What Changed

- moved `ScriptExpressionBuilder.svelte` into `packages/chartx2/src/lib/ui`
- moved the small `ScriptLengthInput.svelte` wrapper alongside it so the script authoring controls stay co-located
- added a focused public `workbench-script-components` barrel and exported it through `@chartx2/library`
- rewired `MarketWorkbenchPanel.svelte` to import both controls from the library
- deleted the old example-owned component files once the panel stopped using them

## Result

- stable script authoring controls are now library-owned instead of example-owned
- the example workbench panel depends only on the public library surface for these controls
- styling and behavior stay unchanged because the moved components keep the same markup and class names

## Verification

- `rg -n "ScriptExpressionBuilder|ScriptLengthInput" packages/chartx2/src/lib/public packages/chartx2/src/lib/ui examples/tauri-svelte/src/lib/example-app/components/MarketWorkbenchPanel.svelte`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
- `git diff --check`
