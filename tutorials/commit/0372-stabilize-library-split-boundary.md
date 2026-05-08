# 0372 Stabilize The Library Split Boundary

This slice locks the post-reorganization consumer rule: hosts import from
`@chartx2/library`, while the official example app can keep demo-only internal
imports inside `examples/tauri-svelte/src/lib/example-app`.

## What Changed

- Added a unit smoke test that consumes reusable shells and workbench helpers
  through `@chartx2/library`.
- Replaced the `/chartx/public` route's machine-specific source path with
  package-entry resolution.
- Added a static split-boundary test for active docs, source summaries, and
  internal import ownership.
- Updated active docs so they name the package boundary instead of old
  pre-workspace paths.
- Wired the root `test:unit` command to run both library and example unit
  suites so the boundary guard is not skipped.

## Verification

Run:

```sh
pnpm test:unit
pnpm --filter @chartx2/example-tauri-svelte exec playwright test tests/visual/phase-one-api.spec.ts tests/visual/phase-one-performance.spec.ts
pnpm check
pnpm build
pnpm test
```

The focused unit gate catches source and doc boundary drift. The two visual
specs prove the browser-only `/chartx/public` endpoint still works for dynamic
imports used by Playwright. The full workspace gates prove the split remains
compatible with the library package and the official example app.
