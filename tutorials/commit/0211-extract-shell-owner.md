# 0211 - Extract Shell Owner

This slice moves chart shell public command composition out of `chart-harness`.

Before this change, `applyOptions` and `resize` still rebuilt their use-case dependency objects directly inside public harness methods. That kept chart-wide option mutation, drawing snap-guide cleanup, manual layout updates, and render invalidation as harness-owned policy.

The new `chart-shell-owner.ts` owns that composition and delegates validation/mutation rules to the existing `chart-shell-commands.ts` use-cases.

## What Changed

- Added `createChartShellOwner`.
- Routed `applyOptions` through the shell owner.
- Routed `resize` through the shell owner.
- Added owner tests for chart option mutation, snap-guide cleanup, resize rounding, and render invalidation.

## Why This Shape

The harness should remain the temporary composition root, but public methods should not each assemble their own runtime policy bags. Moving shell command composition behind one owner keeps external API behavior unchanged while reducing the remaining adapter-shell surface.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-shell-owner chart-shell-commands`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

