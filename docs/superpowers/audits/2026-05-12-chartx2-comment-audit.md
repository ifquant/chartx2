# Chartx2 Comment Audit

Date: 2026-05-12

## Scope

- `packages/chartx2/src/lib/internal`
- `packages/chartx2/src/lib/public`
- `packages/chartx2/src/lib/ui`
- `examples/tauri-svelte/src/lib/example-app`
- `examples/tauri-svelte/src/routes`
- `examples/tauri-svelte/tests`

## Audit Rubric

- `KEEP`: comment explains invariants, ownership, performance, compatibility, or non-obvious behavior
- `REWRITE-NOW`: comment is useful but stale or misleading
- `DELETE`: comment only restates code or adds no durable context
- `DEFER-UNTIL-REFACTOR`: comment problem is real but should wait for a structural code change

## Findings By Subsystem

### 1. Library Internals

| File | Finding | Action | Note |
| --- | --- | --- | --- |
| `packages/chartx2/src/lib/internal/model/chart-model.ts` | No orienting comment explains which ownership stays in `ChartContext` vs `SourceRegistry` vs pane/scale collections. | `DEFER-UNTIL-REFACTOR` | The boundary matters for main-series binding and secondary-scale cleanup, but the stronger fix is to document it when the model facade is split or renamed more explicitly. |
| `packages/chartx2/src/lib/internal/model/pane-model.ts` | Pane allocation and divider semantics have no durable comment coverage around primary-pane persistence, secondary-pane IDs, and resize expectations. | `REWRITE-NOW` | The file is compact enough that one boundary comment near `PaneCollection` and one note near frame/divider resolution would materially improve auditability without waiting for a larger refactor. |
| `packages/chartx2/src/lib/internal/model/source-registry.ts` | Registry identity, ordering, pane relocation, and visibility mutation rules are entirely implicit. | `REWRITE-NOW` | This registry is already a stable unit; a short comment explaining ID/API uniqueness and in-place mutation expectations would be durable. |
| `packages/chartx2/src/lib/internal/model/drawing-registry.ts` | The drawing registry mirrors source-registry behavior but has no note about drawing ownership, pane moves, or API-handle uniqueness. | `REWRITE-NOW` | The missing context is local and stable enough to document now rather than deferring to a larger redesign. |
| `packages/chartx2/src/lib/internal/views/chart-state-coordinator.ts` | The snapshot, clear, restore, and finalize stages run without any durable comment describing the required ordering. | `DEFER-UNTIL-REFACTOR` | This file is a large adapter around multiple restore use-cases; local comments would still leave ownership and restore sequencing hard to audit until the coordinator is broken into clearer phases. |
| `packages/chartx2/src/lib/internal/views/chart-drawing-runtime.ts` | Drawing selection, drag resolution, snap-guide publication, and remove-by-api flows have no lifecycle comments tying the helpers together. | `REWRITE-NOW` | The file already reads like a focused runtime helper; a small number of lifecycle comments would make the drag-and-selection path much easier to audit. |
| `packages/chartx2/src/lib/internal/views/chart-render-coordinator.ts` | The render pipeline has no stage-level comment coverage for pane layout, primary/secondary divergence, or readout publication. | `DEFER-UNTIL-REFACTOR` | The missing context is highest-risk around render invalidation and readout flow, but an 800-line coordinator needs structural staging before comments will stay durable. |

### 2. Public Surface

| File | Finding | Action | Note |
| --- | --- | --- | --- |
| `packages/chartx2/src/lib/public/index.ts` | The top-level barrel has no orienting note about when consumers should use the root export surface versus the narrower feature barrels. | `REWRITE-NOW` | The file is intentionally simple, but one export-surface comment would make the library-first public contract explicit and reduce future `internal/*` drift. |
| `packages/chartx2/src/lib/public/market.ts` | The market barrel exposes the phase-one chart API and helper builders without any boundary comment explaining that this is the package-owned market surface. | `REWRITE-NOW` | The inventory pass found no existing comment lines here; the highest-value fix is a short header note that keeps callers out of `internal/` imports. |
| `packages/chartx2/src/lib/public/workbench.ts` | The workbench contract file lacks a boundary note separating library-owned presentation models from host-provided adapter and persistence interfaces. | `REWRITE-NOW` | The types are readable, but the host-versus-library ownership seam is still implicit across the file. |
| `packages/chartx2/src/lib/public/workbench-alerts.ts` | The local-storage provider quietly swallows storage failures behind one inline comment, but the file has no top-level note about which parts of the alert surface are durable public contract versus convenience host implementation. | `REWRITE-NOW` | This is already part of the root public surface, so one orienting boundary comment would do more than another local catch-block aside. |
| `packages/chartx2/src/lib/public/host-shell-components.ts` | This barrel mixes reusable host-shell exports with `Alpha2HostIntegrationExample` and has no comment explaining whether the example-named component is a stable public contract or a transitional bridge. | `DEFER-UNTIL-REFACTOR` | The missing comment is real, but the deeper issue is export naming and boundary clarity; a durable fix likely needs the surface renamed or split before prose will stay accurate. |
| `packages/chartx2/src/lib/public/workbench-layout.ts` | The layout provider helpers include one inline storage-failure comment, but the public file still lacks a short boundary note explaining how much of layout persistence is package contract versus default host adapter. | `REWRITE-NOW` | This is a real public-surface prose gap because callers can import it directly through the root barrel. |
| `packages/chartx2/src/lib/public/workbench-bottom-panels.ts` | The bottom-panel barrel has no note that these exports are reusable shells whose runtime state still comes from host-owned workbench models and callbacks. | `REWRITE-NOW` | This is an export-surface gap rather than stale language; one short header would clarify the ownership boundary. |
| `packages/chartx2/src/lib/public/workbench-drawing-inspector.ts` | The drawing-inspector barrel does not explain that `null` means “no selected drawing” and that the schema comes from the market drawing contract rather than a host-local form model. | `REWRITE-NOW` | The audited file is self-explanatory at a type level, but the boundary note is still missing. |
| `packages/chartx2/src/lib/public/workbench-workspace-tabs.ts` | The workspace-tab barrel lacks any note that the strip is package-owned UI while tab lifecycle, closeability, and workspace orchestration remain host decisions. | `REWRITE-NOW` | This is a small file, so a focused export comment would be durable. |

### 3. Reusable UI

| File | Finding | Action | Note |
| --- | --- | --- | --- |
| `packages/chartx2/src/lib/ui/ChartFrameShell.svelte` | The shell has no orienting comment that it only provides frame chrome and delegates tool actions, chip actions, and inner content ownership to the host. | `REWRITE-NOW` | The file has no existing comments, so the gap is missing boundary context rather than stale demo prose. |
| `packages/chartx2/src/lib/ui/MarketPanelShell.svelte` | The library-owned market panel has no short note about which surface state is rendered generically and which quote/depth/profile ownership still belongs to the host. | `REWRITE-NOW` | The component is public and chart-adjacent, so missing boundary prose here weakens the library-first contract. |
| `packages/chartx2/src/lib/ui/PhaseOneMarketChartSurface.svelte` | The mount, rebuild, and crosshair-subscription flow has no stage-level comment explaining when the chart is rebuilt from scratch versus patched in place. | `REWRITE-NOW` | This is the highest-value reusable-UI comment gap because the lifecycle is not obvious from a quick audit. |
| `packages/chartx2/src/lib/ui/ActivityLogPanel.svelte` | The panel is now library-owned, but there is no note that it is a generic shell over host-provided log strings rather than an owner of event semantics. | `REWRITE-NOW` | The code is small enough that one boundary sentence would be durable. |
| `packages/chartx2/src/lib/ui/ReplayPanel.svelte` | The replay controls have no orienting comment that availability, active state, and playback actions all remain host-driven through the public replay model. | `REWRITE-NOW` | This is a reusable shell with a non-obvious host-control boundary. |
| `packages/chartx2/src/lib/ui/TimePresetsPanel.svelte` | The panel offers reusable preset chrome but does not explain that the actual preset list and behavior remain host-owned workbench state. | `REWRITE-NOW` | Missing boundary prose is higher risk than stale comments because the component now lives in the package. |
| `packages/chartx2/src/lib/ui/TradingLedgerPanel.svelte` | The panel does not document why it falls back to the first row when no selection is provided or how much of the detail card is expected to stay host-owned. | `REWRITE-NOW` | A short note near `selectedRow` would make the fallback and ownership contract easier to audit. |
| `packages/chartx2/src/lib/ui/WorkbenchDrawingInspectorPanel.svelte` | The schema-driven control switch has no comment explaining that the library renders generic controls while validation and mutation stay with the host callback layer. | `REWRITE-NOW` | The control branching is readable, but the cross-layer responsibility split is still implicit. |
| `packages/chartx2/src/lib/ui/WorkbenchWorkspaceTabStrip.svelte` | The strip does not explain that it owns only the rendering and responsive chrome while tab creation, closeability, and orchestration policy remain with the host. | `REWRITE-NOW` | This is a stable extracted primitive, so the ownership note should live with the component rather than only in its barrel. |

### 4. Example Host

| File | Finding | Action | Note |
| --- | --- | --- | --- |
| `examples/tauri-svelte/src/routes/+layout.ts` | The top-of-file SPA/SSR note still accurately explains why the Tauri example host disables SSR and links the reader to the correct SvelteKit and Tauri docs. | `KEEP` | This is high-signal environment context, not throwaway setup narration. |
| `examples/tauri-svelte/src/routes/+page.svelte` | The route shell owns top-tab orchestration, mount retries, teardown, and visual-harness script-adapter injection without any orienting comment that explains why those lifecycle decisions stay in the example host instead of the package. | `REWRITE-NOW` | A short ownership note near the top-level mount/orchestration flow would make this file much easier to audit after the library split. |
| `examples/tauri-svelte/src/lib/example-app/chartx-demo.ts` | The inline `Demo note` above `saveLayout()` still uses demo-era and slice-local wording even though the example host now wires package-owned layout persistence helpers through an explicit host adapter boundary. | `REWRITE-NOW` | Rewrite the comment in terms of durable example-host ownership: layout persistence is still scoped to the active example host, while multi-host save/restore remains intentionally unimplemented. |
| `examples/tauri-svelte/src/lib/example-app/workbench-fixtures.ts` | The fixture watchlist, bars payload builders, and example host adapter wrapper have no boundary note explaining that they are showcase data seams, not part of the package truth surface. | `REWRITE-NOW` | This is one of the most important example-owned helper files, so the missing ownership comment should be queued explicitly. |
| `examples/tauri-svelte/tests/unit/library-split-boundary.test.ts` | The repo-level boundary-guard note correctly explains why a split-boundary assertion lives in the example unit suite instead of pretending to be a package-local test. | `KEEP` | This is one of the few test comments that materially explains repo structure and should survive. |

## Cross-Cutting Risks

- Internal runtime comments are mostly sparse; the highest-value missing context is around render invalidation, state restore, and drawing lifecycle.
- Public barrels and reusable UI shells are mostly comment-free; the main risk is missing export-boundary notes on both the barrels and the concrete library-owned shells, not stale demo-era prose.
- Example-host comments are the main stale-language hotspot; the remaining fixes should replace demo-era wording with durable example-host ownership notes before any broader runtime cleanup starts.

## Suggested Remediation Order

1. Rewrite the stale or missing example-host ownership comments in `+page.svelte`, `chartx-demo.ts`, and `workbench-fixtures.ts` so lifecycle, persistence, and fixture seams stop reading like demo-era scaffolding.
2. Add narrow boundary comments to `pane-model.ts`, `source-registry.ts`, and `drawing-registry.ts`, where the files are already small and stable enough for durable inline notes.
3. Add lifecycle comments to `chart-drawing-runtime.ts` and `PhaseOneMarketChartSurface.svelte` before touching the larger render and restore coordinators.
4. Defer `chart-model.ts`, `chart-state-coordinator.ts`, and `chart-render-coordinator.ts` comment rewrites until their ownership and staging seams are split more explicitly.
