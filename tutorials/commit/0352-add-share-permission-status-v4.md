# 0352 add share permission status v4

## Why

The sharing seam could already publish, show metadata, preview history, and
surface import review rows, but it still had no typed place to show permission
or status boundaries. Host modules need that shell so users can understand who
controls a shared artifact before real policy engines exist.

## What changed

- extended the public share contract with readonly permission entries
- rendered fixture-backed permission/status rows inside the share dialog after
  publish
- added a local `View permissions` secondary action for deterministic shell
  feedback
- added focused visual coverage for the permission/status seam

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "share dialog: published artifacts surface an import review queue shell|share dialog: published artifacts surface readonly permission status rows" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no real permission mutation flow or host approval engine
- no backend ACL store, moderation system, or marketplace policy service
