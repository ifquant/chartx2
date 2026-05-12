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

### 3. Reusable UI

| File | Finding | Action | Note |
| --- | --- | --- | --- |

### 4. Example Host

| File | Finding | Action | Note |
| --- | --- | --- | --- |

## Cross-Cutting Risks

- Internal runtime comments are mostly sparse; the highest-value missing context is around render invalidation, state restore, and drawing lifecycle.

## Suggested Remediation Order

1. Add narrow boundary comments to `pane-model.ts`, `source-registry.ts`, and `drawing-registry.ts`, where the files are already small and stable enough for durable inline notes.
2. Add lifecycle comments to `chart-drawing-runtime.ts` before touching the larger render and restore coordinators.
3. Defer `chart-model.ts`, `chart-state-coordinator.ts`, and `chart-render-coordinator.ts` comment rewrites until their ownership and staging seams are split more explicitly.
