## Scripted Study Descriptor Creator Seam V1

### Goal

Remove the last open-coded `scripted-study.studyOptions` assembly in the demo shell so descriptor serialization stays aligned with the shared workbench-layout bridge.

### Scope

- Add a shared descriptor creator in `workbench-layout.ts`.
- Rewire `chartx-demo.ts` scripted-indicator serialization to use it.
- Add focused unit coverage for the creator.

### Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

### Not included

- Any behavior change to runtime script execution or restore.
- Engine-native scripted-study ownership.
