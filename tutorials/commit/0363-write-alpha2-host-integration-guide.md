# 0363 write alpha2 host integration guide

## Why

By this point the public contracts and host shell components were available
through the `chartx` barrel, but a downstream host still had to read demo code
to understand what `chartx2` owns versus what the host must wire itself.

## What changed

- added a checked-in `alpha2` host integration guide under `docs/`
- documented the intended public import seam for contracts and reusable Svelte
  shells
- documented the current host-owned responsibilities, the summary registry
  rule, and the recommended dock-based composition pattern
- linked the workstation architecture note back to the new integration guide

## Verification

- documentation review only
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no new runtime helper or host adapter implementation
- no package split or publishing workflow for the public UI layer
