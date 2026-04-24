# 0312 add scripted study promotion review pass

## Why

The script-system execution wave now has enough concrete implementation behind
it that we need a sharper statement of what changed and what still has not been
promoted into engine-native chart-state ownership. Without that explicit review
pass, the alignment plan would make it too easy to over-read the new descriptor
bridge and restore helper as “scripted studies are done”.

## What changed

- added a dedicated review-pass note that audits the completed scripted-study
  bridge work and lists the exact remaining promotion blockers
- updated the TradingView alignment plan to distinguish “descriptor bridge and
  restore are in place” from “scripted studies are first-class chart-state
  studies”
- kept the remaining next steps explicit: engine-owned study shape, restore
  seam, library-resolution decision, and backward-compat migration window

## Verification

- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no code or test changes
- no engine-native scripted-study promotion
- no Pine-compatible parser or execution work
