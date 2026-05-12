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
| `packages/chartx2/src/lib/internal/views/chart-state-coordinator.ts` | The snapshot, clear, restore, and finalize stages run without any durable comment describing the required ordering. | `DEFER-UNTIL-REFACTOR` | This file is a large adapter around multiple restore use-cases; local comments would still leave ownership and restore sequencing hard to audit until the coordinator is broken into clearer phases. |
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

1. None yet.
