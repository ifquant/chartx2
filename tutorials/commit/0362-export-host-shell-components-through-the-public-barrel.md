# 0362 export host shell components through the public barrel

## Why

The public barrel already exposed the host-facing contracts, but the reusable
Svelte shells still lived behind `demo/components/...` paths. That meant
downstream modules could type against the right models while still depending on
internal-looking component imports.

## What changed

- added a `host-shell-components` public entrypoint that re-exports the
  reusable sharing, strategy, trading, and sync Svelte shells
- re-exported that entrypoint through the main public barrel

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no attempt to export `MarketWorkbenchPanel` or other demo-app shells as part
  of the public component surface
- no semantic versioning or package manifest split for the public UI layer yet
- no standalone Vitest smoke for the Svelte component barrel; this slice relies
  on `svelte-check` and production build verification instead
