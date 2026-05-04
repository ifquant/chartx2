# 0356 add account sync summary shell v1

## Why

The account sync surface already had a sidebar card, but host modules still had
no compact way to embed sync state without reusing the whole sidebar layout. A
summary shell makes the sync surface more reusable and more library-like for
other workbench hosts.

## What changed

- extended the public account sync contract with a readonly summary shell model
- added a reusable account sync summary card component
- mounted the summary shell outside the sidebar card and wired its refresh
  action into the same existing sync seam
- added focused visual coverage for the summary shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "account sync projects into a reusable summary shell outside the sidebar card" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no real sync conflict flow or cloud account engine
- no provider switcher, merge dialog, or account settings surface
