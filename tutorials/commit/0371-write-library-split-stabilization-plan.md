# 0371 Write The Library Split Stabilization Plan

This commit adds the implementation plan for stabilizing the new `chartx2`
workspace split after the library/example reorganization.

## Why This Exists

`alpha2` already exposed the first integration break caused by the split: hosts
can accidentally point at old source paths when `chartx2` moves public code into
`packages/chartx2`. The next slice needs a written plan that turns that lesson
into package-consumer tests, static boundary checks, and active documentation
cleanup.

## What The Plan Covers

- A public package smoke test for `@chartx2/library`.
- Removal of the hardcoded absolute path in the `/chartx/public` endpoint.
- Static checks for stale pre-split paths in active docs and live source.
- A clear rule for the example app's `@chartx2/library/internal` alias.
- Final verification and commit instructions for the implementation slice.

## Baseline

Before writing the plan, the current workspace passed:

```sh
pnpm check
pnpm build
pnpm test
```

The full test pass covered 534 library unit tests, 12 example unit tests, and
195 example Playwright visual tests.
