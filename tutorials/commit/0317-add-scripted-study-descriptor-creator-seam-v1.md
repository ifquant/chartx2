# 0317 add scripted study descriptor creator seam v1

## Why

After the earlier promotion work, `chartx-demo.ts` still had one local place that manually assembled scripted-study descriptor `studyOptions` with default context fields.

That was small, but it was still a real drift risk:

- engine/native `scripted-study.studyOptions` can evolve
- the layout bridge already owns normalization/defaults
- the demo shell should not be a second schema-definition site

## What changed

- `workbench-layout.ts` now exports `createWorkbenchLayoutScriptedIndicatorDescriptor(...)`
- `chartx-demo.ts` now routes scripted-indicator serialization through that shared creator
- `workbench-layout.test.ts` adds focused coverage for the new creator helper

## Outcome

There is now one shared place that decides how workbench-owned scripted-study descriptors are normalized into the canonical bridge shape.

That keeps the demo shell thinner and reduces the chance that a future `studyOptions` field/default changes in one place but not the other.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

## Not included

- No change to restore/import behavior.
- No change to script runtime execution.
- No change to engine-native scripted-study ownership.
