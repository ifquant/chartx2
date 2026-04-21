# 0220 - Extract Study Source Owner

This slice moves pane-aware study source construction out of `chart-harness`.

Before this change, `sourceOwner` received a large inline `studySources` dependency object from the harness. That object knew how to choose primary versus secondary price scales, call `createStudySourceState`, apply default compare options, create series options, and register the resulting source.

## What Changed

- Added `chart-study-source-owner` as the internal owner for study source creation and registration dependencies.
- Rewired `chart-harness` so `sourceOwner` consumes `studySourceOwner.studySources`.
- Added focused tests for compare study creation on the primary pane and secondary-pane price-scale routing.
- Updated architecture notes with the new study source ownership boundary.

## Why This Shape

Study source construction is source lifecycle policy. Keeping it behind one owner narrows the harness role to supplying model access and defaults, while `sourceOwner` still owns attach/add orchestration.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-study-source-owner chart-source-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
