# 0354 add strategy tester summary shell v8

## Why

The strategy tester already had a capable bottom-panel shell, but host modules
still had no compact way to embed tester state without mounting the whole
interactive panel. A summary shell makes the contract more reusable and more
library-like for other workbench hosts.

## What changed

- extended the public strategy tester contract with a readonly summary shell
  model
- added a reusable strategy tester summary card component
- mounted the summary shell outside the panel body so it can reopen the tester
  panel without living inside it
- added focused visual coverage for the summary shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester projects into a reusable summary shell outside the panel body" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no synchronization from panel-local run switching back into the outer summary shell
- no strategy gallery, compare browser, or engine-backed run management flow
