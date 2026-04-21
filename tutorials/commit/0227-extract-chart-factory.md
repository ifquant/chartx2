# 0227 - Extract Chart Factory

This slice moves chart creation handoff out of `chart-harness`.

Before this change, `createPhaseOneChart` validated the canvas, constructed the harness, attached it, and passed it into the public API wrapper directly in the harness file.

## What Changed

- Added `chart-factory` for canvas validation, harness construction, attach, and public API handoff.
- Rewired `createPhaseOneChart` to delegate to the factory helper.
- Added focused tests for attach and public destroy routing.
- Updated architecture notes with the factory boundary.

## Why This Shape

Factory setup is adapter-shell work, not runtime policy. Pulling it out makes `chart-harness` closer to the temporary composition root rather than the owner of public API construction.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-factory chart-public-api chart-demo-mount`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
