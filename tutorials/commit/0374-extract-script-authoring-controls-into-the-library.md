# 0374 Extract Script Authoring Controls Into The Library

Date: 2026-05-08

## Why

The custom-script builder controls in the official example app had stabilized into reusable workbench UI, but they still lived under `examples/`. That left the library/example split incomplete and forced the host panel to reach into example-owned components for script authoring.

## What Changed

- moved `ScriptExpressionBuilder.svelte` into `packages/chartx2/src/lib/ui`
- gave the moved builder its own scoped styles so it no longer depends on hidden example-only `:global(...)` rules
- added a focused public `workbench-script-components` barrel and exported only `ScriptExpressionBuilder` through `@chartx2/library`
- rewired `MarketWorkbenchPanel.svelte` to import the builder from the library and inlined the trivial length `<input>` fields locally instead of promoting a passthrough wrapper into the public API
- deleted the old example-owned component files once the panel stopped using them

## Result

- the stable script-expression builder is now library-owned instead of example-owned
- the example workbench panel depends on the public library surface for the reusable builder control without growing the public API for a trivial input wrapper
- styling and behavior stay unchanged because the builder keeps the same markup, class names, and local visual rules

## Verification

- `pnpm --filter @chartx2/library exec vitest run packages/chartx2/tests/unit/public-index-contract.test.ts`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
- `git diff --check`
