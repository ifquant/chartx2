# Workbench Adapter Status V0 Checklist

> This slice continues `Layer 2: Workstation UX And Command Surface` by making
> missing providers visible in the shell instead of leaving them as implicit
> runtime failures.

## Goal

- [x] publish adapter status through the public workbench shell
- [x] show missing local persistence providers as explicit workstation state
- [x] keep `+page.svelte` as a thin browser shell that may fail to acquire
  storage, but does not own workstation policy
- [x] disable affected toolbar actions when the relevant provider is missing
- [x] cover the degraded-provider path in browser tests

## Implementation

- [x] extend `src/lib/chartx/public/workbench.ts` with `adapterStatus`
- [x] add default and explicit adapter-status assertions in
  `tests/unit/workbench-contract.test.ts`
- [x] publish market-data/layout-persistence/alerts-persistence status rows from
  `src/lib/demo/chartx-demo.ts`
- [x] catch storage acquisition failures in `src/routes/+page.svelte` and pass
  `undefined` providers instead of crashing the page shell
- [x] render an adapter-status card and explicit toolbar disable states in
  `src/lib/demo/components/MarketWorkbenchPanel.svelte`
- [x] add browser coverage for missing local storage providers in
  `tests/visual/phase-one-harness.spec.ts`

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-contract.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "adapter status|command palette|saves and restores"`

## Not Included

- [ ] richer missing-data empty states for every workstation panel
- [ ] remote adapter health, retry, or reconnect flows
- [ ] persistence import/export beyond `WorkbenchLayoutState`
