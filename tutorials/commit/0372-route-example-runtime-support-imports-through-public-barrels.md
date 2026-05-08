# 0372 Route Example Runtime Support Imports Through Public Barrels

Date: 2026-05-08

## Why

After the library-first workspace split, the official example app still reached into `@chartx2/library/internal/...` for a handful of chart-build and performance harness helpers. That kept the example running, but it weakened the source-code ownership boundary we are trying to stabilize.

## What Changed

- promoted the chart-build helpers used by `chartx-demo.ts` onto the public market surface
- promoted the performance canvas harness classes onto the public performance surface
- rewired the example runtime to import those helpers from `@chartx2/library` instead of `@chartx2/library/internal/...`

## Result

- `packages/chartx2` stays the only declared owner of reusable chart/runtime support code
- `examples/tauri-svelte` no longer needs internal-path imports for its active runtime assembly
- the library/example split is tighter at the source-import level, not just the directory level

## Verification

- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
