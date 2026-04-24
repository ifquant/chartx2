# 0316 add scripted study projection and restore seams v1

## Why

The scripted-study promotion line had reached an awkward middle state:

- engine chart state already knew about `scripted-study`
- workbench layout already persisted a descriptor bridge using engine-shaped `studyOptions`
- but demo/workbench surfaces still had two separate ways to think about scripted studies

That showed up in two places:

1. The object tree could only show rich scripted-study labels because it appended a second workbench-only `scriptIndicators` list after rendering engine/projected studies.
2. Layout restore/import, workspace activation, and host activation all replayed scripted studies through slightly different local flows, and they silently claimed success even if one or more scripted studies failed to remount.

On top of that, live workbench-owned script panes could still leak into persisted chart state, which made the descriptor bridge less clean than it looked on paper.

## What changed

### 1. Object tree now uses one study projection path

`chartx-demo.ts` now enriches `chartProjection.studies` with optional display metadata for scripted studies:

- `label`
- `detailLabel`
- `badgeLabel`

That lets `buildWorkbenchObjectTree(...)` render scripted studies through the same study-node loop it already uses for moving averages, compare series, and overlays.

The old extra append loop for `scriptIndicators` is gone. The object tree no longer has a second scripted-study source of truth.

There are still two upstream sources of scripted-study knowledge:

- engine/native `chartState.studies`
- workbench-owned active scripted indicators

But they are merged before rendering, not rendered in parallel.

### 2. Persisted scripted-study replay now goes through one apply helper

`chartx-demo.ts` now routes these flows through the same persisted-content apply seam:

- layout restore
- layout import
- workspace tab activation
- host activation

The helper applies chart state if present, refreshes object-tree projection, replays scripted-study descriptors, and returns one of:

- `complete`
- `partial`
- `failed`

That means callers no longer ignore `restoreScriptedStudyDescriptors(...)` failures.

### 3. Partial scripted-study replay is now visible

Before this commit, a layout/workspace/host operation could say it restored successfully even though one or more scripted studies were dropped.

Now those callers downgrade to warning state when scripted-study replay is incomplete. The underlying per-indicator failure logging still happens, but the top-level user-facing status is no longer falsely clean.

### 4. Descriptor-owned panes are stripped back out of persisted chart state

The layout bridge was already stripping engine `scripted-study` entries from chart state when descriptor replay was present.

This commit hardens that cleanup in two places:

- `chartx-demo.ts` strips live active script pane indexes out of the captured chart state before persistence
- `workbench-layout.ts` now has a pane-index strip helper and a trailing separate-pane fallback when scripted descriptors are being persisted

That keeps exported/saved chart state aligned with the current ownership rule:

- scripted-study restore comes from the workbench descriptor bridge
- persisted chart state should not carry duplicate workbench script panes alongside it

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "layout import/export|workbench saves and restores the active layout locally|workbench object tree reflects indicators and drawings|script library: custom authored scripts round-trip through layout export and import|script library: scripted studies round-trip through restore and import" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- Engine-native ownership for workbench-authored scripted studies.
- Overlay scripted-study support.
- Pine-compatible evaluation.
- A broader Script Library UX pass.
