# 0349 add share metadata shell v1

## Why

The share dialog already proved where publish UI mounts, but it was still too
thin to be a useful reusable surface. For `alpha2`, the higher-value step is a
library-like share shell that can expose artifact metadata and a few
post-publish actions without forcing `chartx2` to own real backend review or
marketplace behavior.

## What changed

- extended the public sharing contract with readonly artifact metadata rows and
  secondary action definitions
- updated the reusable share dialog shell to render metadata and post-publish
  secondary actions
- wired the demo shell to support thin local `Copy link` and `Review shell`
  feedback after publishing
- added focused Playwright coverage for publish plus metadata/action surfacing
- updated the alignment plan to record the thicker share shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "share dialog: toolbar trigger opens a fixture-backed publish shell|share dialog: published artifacts surface metadata and secondary actions" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not add real copy-to-clipboard, review queues, trust policy, or backend persistence
- marketplace browsing and version history remain separate future surfaces
