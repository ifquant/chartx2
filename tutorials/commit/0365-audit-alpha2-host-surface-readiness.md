# 0365 audit alpha2 host surface readiness

## Why

After exporting the public contracts, reusable host shells, integration guide,
and minimal embedding example, the remaining ambiguity was not implementation.
It was readiness: which surfaces should `alpha2` trust now, and which should
still be treated as intentionally thin or demo-leaning.

## What changed

- added a checked-in host-surface readiness audit under `docs/`
- classified the current host-facing surfaces into:
  - ready now
  - usable but still demo-leaning
  - not yet a stable host boundary
- linked the integration guide and alignment plan to the new readiness note

## Verification

- documentation review only
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no new runtime seam or callback formalization
- no code changes to move a surface from demo-leaning to fully stable
