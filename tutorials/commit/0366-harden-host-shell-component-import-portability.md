# 0366 harden host shell component import portability

## Why

The public host shell components were exported through the `chartx` barrel, but
their internal imports still relied on chartx2-local `$lib/...` aliases. That
meant another repo could import the public component seam in theory while still
failing to build it in practice.

## What changed

- rewired the host-facing demo components to use relative imports for their own
  local component and public-contract dependencies
- kept the public component surface the same while removing the repo-local alias
  assumption from the internal import graph
- updated the host readiness note to record that the host-facing component graph
  is now portable across repo boundaries

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no directory move from `demo/components` to a dedicated public-ui tree
- no change to the host shell API or model contracts themselves
