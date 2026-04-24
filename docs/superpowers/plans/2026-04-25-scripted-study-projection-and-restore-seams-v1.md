## Scripted Study Projection And Restore Seams V1

### Goal

Close the remaining demo/workbench drift above the scripted-study promotion seam so object-tree rendering, layout restore/import, workspace activation, and host activation all follow one coherent scripted-study path.

### Scope

- Collapse object-tree scripted-study rendering onto a single study projection path.
- Share one helper for applying persisted chart state plus scripted-study descriptors.
- Surface partial scripted-study replay as warning state instead of silent success.
- Strip workbench-owned separate panes back out of persisted chart state when descriptor replay is the canonical restore path.

### Non-goals

- Pine compatibility.
- Overlay scripted studies.
- Engine-native replacement of the workbench descriptor bridge.
- Broader script-library editor UX.

### Tasks

1. Enrich `chartx-demo.ts` study projection so object-tree study nodes can carry scripted-study labels/detail/badges without a second `scriptIndicators` append loop.
2. Rewire `buildWorkbenchObjectTree(...)` to consume only `chartProjection.studies`.
3. Extract a shared persisted-content apply helper for:
   - layout restore
   - layout import
   - workspace tab activation
   - host activation
4. Treat failed scripted-study replay as `partial` apply and surface warning status in the calling flows.
5. Harden persisted chart-state sanitization so descriptor-owned separate panes do not leak into saved/exported chart state.

### Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "layout import/export|workbench saves and restores the active layout locally|workbench object tree reflects indicators and drawings|script library: custom authored scripts round-trip through layout export and import|script library: scripted studies round-trip through restore and import" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

### Notes

- This is still a bridge-seam slice. The workbench descriptor path remains canonical for workbench-owned scripted studies even though engine chart state now understands `scripted-study`.
- The trailing-pane strip is intentionally conservative and only applies while descriptor replay is present. Full pane ownership should move into engine-native scripted-study mounting later.
