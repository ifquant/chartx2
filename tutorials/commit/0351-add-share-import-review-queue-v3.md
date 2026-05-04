# 0351 add share import review queue v3

## Why

The share shell could now publish artifacts, show metadata, and preview recent
history, but it still had no typed place to surface import or review checks.
Other host modules need a stable queue-shaped UI seam so they can reuse
`chartx2` sharing components without waiting for backend review services.

## What changed

- extended the public share contract with readonly review entries
- rendered a fixture-backed import/review queue section inside the share dialog
- added a local `Open import review` secondary action for deterministic shell
  feedback
- added focused visual coverage for the new review queue seam

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "share dialog: published artifacts surface version history previews|share dialog: published artifacts surface an import review queue shell" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no real review queue persistence or host approval workflow
- no script trust service or marketplace listing flow
