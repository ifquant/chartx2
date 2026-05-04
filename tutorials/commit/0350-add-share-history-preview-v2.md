# 0350 add share history preview v2

## Why

The sharing shell already exposed publish status, metadata, and secondary
actions, but it still had no way to show recent artifact lineage. Other host
modules need a stable, reusable place to mount version/history UI without
forcing `chartx2` to own a publication backend.

## What changed

- extended the public share contract with readonly history entries
- rendered recent version/history rows inside the share dialog after publish
- added a local history-preview action so hosts have a stable secondary action
  seam without backend behavior
- added focused visual coverage for the history surface

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "share dialog: toolbar trigger opens a fixture-backed publish shell|share dialog: published artifacts surface metadata and secondary actions|share dialog: published artifacts surface version history previews" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no backend version store or publish audit log
- no import/review queue or marketplace browse flow
