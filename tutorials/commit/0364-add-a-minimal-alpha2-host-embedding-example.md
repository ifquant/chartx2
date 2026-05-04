# 0364 add a minimal alpha2 host embedding example

## Why

The host integration guide explained the boundary, but the fastest way for a
downstream module to start using `chartx2` is still a real compiled example.
Without that, the first host integration still starts by translating prose into
code.

## What changed

- added `Alpha2HostIntegrationExample.svelte` to the public host shell surface
- exported that example through the public host shell component entrypoint
- updated the host integration guide and alignment plan to point at the example
  as the concrete minimal embedding reference

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no new host runtime helper; the example still uses local fixture-backed
  models
- no dedicated route or demo page for this example; it remains a public example
  component
