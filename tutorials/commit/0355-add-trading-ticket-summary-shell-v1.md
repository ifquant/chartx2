# 0355 add trading ticket summary shell v1

## Why

The trading ticket already had a bottom-panel shell, but host modules still had
no compact way to embed ticket state without opening the whole panel. A summary
shell makes the trading surface more reusable and more library-like for other
workbench hosts.

## What changed

- extended the public trading contract with a readonly summary shell model
- added a reusable trading ticket summary card component
- mounted the summary shell outside the panel body so it can reopen the ticket
  panel without living inside it
- added focused visual coverage for the summary shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "trading ticket projects into a reusable summary shell outside the panel body" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no live order mutation flow or broker callback integration
- no ticket gallery, blotter, or multi-account order routing surface
