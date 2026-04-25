# 0339 add mobile bottom trigger labels v0

## Why

The mobile footer strip still carried long trigger copy like `Open Time presets`
and `Open Controls` even after the surrounding mobile shell had already been
compacted. That was pure width overhead in the narrowest navigation row.

## What changed

- shortened the mobile bottom-panel trigger to use only the active panel label
  when closed and `Hide panel` when open
- shortened the footer-controls trigger to use a stable `Controls` label
- kept the underlying open/close behavior unchanged
- added focused Playwright coverage for the compact mobile trigger labels
- updated the alignment plan to record the footer-strip density pass

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile bottom triggers use compact labels" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not yet change bottom-tab ordering or overflow behavior
- the underlying mobile bottom-panel and footer-controls interactions are unchanged
