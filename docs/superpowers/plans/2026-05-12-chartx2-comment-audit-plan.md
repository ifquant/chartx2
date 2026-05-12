# Chartx2 Comment Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Execution record note:** this file was checked in after the audit finished so the repo keeps a durable plan-plus-execution artifact. The checked boxes reflect work reconstructed from the landed audit commits, not a still-open execution prompt.

**Goal:** audit `chartx2` comments and inline documentation against the current library-first workspace boundary, then land one checked-in audit report that identifies which comments should be kept, rewritten, deleted, or deferred.

**Architecture:** this is a documentation-and-audit pass, not a refactor pass. The implementation should create one durable audit artifact under `docs/superpowers/audits/`, inspect the library internals, public surface, reusable UI, and example app host separately, and classify findings by action type so later remediation can happen in narrow commits.

**Tech Stack:** Markdown, `rg`, `sed`, `pnpm`, git, Svelte 5, TypeScript, Tauri workspace layout

---

## Planned Files

- Create: `/Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md`
  - single source of truth for the audit findings
  - contains rubric, subsystem findings, concrete file-level observations, and remediation queue
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/plans/2026-05-12-chartx2-comment-audit-plan.md`
  - if this file is tracked after execution, checkbox state should reflect the landed audit commits explicitly rather than pretending it is still a fresh prompt

No source files are meant to change during the audit pass itself unless the user explicitly broadens scope from “审查” to “顺手修”.

## Audit Rules

Use this rubric consistently in every task:

- Keep comments that explain invariants, ownership boundaries, serialization/compatibility constraints, render-performance traps, or behavior that is not obvious from the code alone.
- Rewrite comments that still describe pre-library-split structure, old `demo` ownership, stale path assumptions, or behavior that is no longer true on disk.
- Delete comments that merely restate code, label obvious branches, or narrate assignments without adding meaning.
- Defer comments that would only make sense after a future structural refactor; record them in the audit report instead of rewriting speculative prose.

Use these action labels in the audit report:

- `KEEP`
- `REWRITE-NOW`
- `DELETE`
- `DEFER-UNTIL-REFACTOR`

### Task 1: Create The Audit Artifact And Rubric

**Files:**
- Create: `/Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/AGENTS.md`

- [x] **Step 1: Create the audit directory if it does not exist**

Run:

```bash
mkdir -p /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits
```

Expected: command exits 0 and leaves the directory present.

- [x] **Step 2: Write the audit report scaffold**

Write this exact initial content to `/Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md`:

```md
# Chartx2 Comment Audit

Date: 2026-05-12

## Scope

- `packages/chartx2/src/lib/internal`
- `packages/chartx2/src/lib/public`
- `packages/chartx2/src/lib/ui`
- `examples/tauri-svelte/src/lib/example-app`
- `examples/tauri-svelte/src/routes`

## Audit Rubric

- `KEEP`: comment explains invariants, ownership, performance, compatibility, or non-obvious behavior
- `REWRITE-NOW`: comment is useful but stale or misleading
- `DELETE`: comment only restates code or adds no durable context
- `DEFER-UNTIL-REFACTOR`: comment problem is real but should wait for a structural code change

## Findings By Subsystem

### 1. Library Internals

| File | Finding | Action | Note |
| --- | --- | --- | --- |

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

- None recorded yet.

## Suggested Remediation Order

1. None yet.
```

- [x] **Step 3: Verify the scaffold exists and contains the required sections**

Run:

```bash
rg -n "Audit Rubric|Findings By Subsystem|Suggested Remediation Order" /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md
```

Expected: three matches, one for each required section.

- [x] **Step 4: Commit the audit scaffold**

Run:

```bash
git -C /Users/dev/workspace2/hc_apps/chartx2 add docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md
git -C /Users/dev/workspace2/hc_apps/chartx2 commit -F - <<'EOF'
docs(chartx2-comments): add the comment-audit report scaffold

Create a checked-in audit artifact before reading files so the review has one durable destination and later remediation can point to concrete findings instead of chat summaries.

Changes:
- add the 2026-05-12 chartx2 comment audit report scaffold under docs/superpowers/audits
- define the audit rubric and subsystem sections that later tasks will fill in
- keep the initial pass documentation-only so comment fixes stay separate from the review itself

Verification:
- rg -n "Audit Rubric|Findings By Subsystem|Suggested Remediation Order" /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md (PASS)

Not included:
- no source comments have been changed yet
- no remediation prioritization has been filled in yet
EOF
```

Expected: one docs-only commit created.

### Task 2: Audit Library Internals For Boundary And Invariant Comments

**Files:**
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/foundation.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/model/chart-model.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/model/pane-model.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/model/source-registry.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/model/drawing-registry.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/views/chart-entry.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/views/chart-state-coordinator.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/views/chart-render-coordinator.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/views/chart-drawing-runtime.ts`
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md`

- [x] **Step 1: Inventory existing comments in the internal entrypoint files**

Run:

```bash
rg -n "^\s*(//|/\*|\*)" \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/foundation.ts \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/model/chart-model.ts \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/model/pane-model.ts \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/model/source-registry.ts \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/model/drawing-registry.ts \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/views/chart-entry.ts \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/views/chart-state-coordinator.ts \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/views/chart-render-coordinator.ts \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal/views/chart-drawing-runtime.ts
```

Expected: a raw list of comment-bearing lines to review one file at a time.

- [x] **Step 2: Read each internal file and classify comments against the rubric**

Read each file in full and append rows to the `Library Internals` table in the audit report. For every meaningful comment block, decide one of:

- `KEEP` if it explains engine ownership, shared time-scale invariants, pane/source identity, drawing/runtime coupling, or render invalidation behavior
- `REWRITE-NOW` if it still describes pre-split repo shape, stale demo ownership, or code that has drifted
- `DELETE` if it only narrates obvious code
- `DEFER-UNTIL-REFACTOR` if the comment problem is really a larger structural naming problem

- [x] **Step 3: Record one subsystem summary under Cross-Cutting Risks**

Append a short bullet under `Cross-Cutting Risks` in the report that summarizes the dominant failure mode you saw in internals. Use one of these exact phrasings if applicable:

```md
- Internal runtime comments over-explain local code but still under-document ownership boundaries between chart model, pane model, and source registry.
- Internal runtime comments are mostly sparse; the highest-value missing context is around render invalidation, state restore, and drawing lifecycle.
```

- [x] **Step 4: Commit the internal-audit findings**

Run:

```bash
git -C /Users/dev/workspace2/hc_apps/chartx2 add docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md
git -C /Users/dev/workspace2/hc_apps/chartx2 commit -F - <<'EOF'
docs(chartx2-comments): audit internal engine comments

Record the first real findings from the comment audit where the chart runtime has the highest risk of stale or missing explanatory context around ownership, invalidation, and restore flows.

Changes:
- review comment-bearing internal engine entrypoints across model and view coordination files
- classify each finding in the audit report as keep, rewrite-now, delete, or defer-until-refactor
- summarize the dominant internal comment risks in the cross-cutting section

Verification:
- rg -n "Library Internals|Cross-Cutting Risks" /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md (PASS)

Not included:
- no public-surface or example-host comment findings are recorded in this commit
- no source comments are changed yet
EOF
```

Expected: one docs-only commit created with internal findings.

### Task 3: Audit Public Surface And Reusable UI Comments

**Files:**
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/index.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/market.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/workbench.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/host-shell-components.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/workbench-bottom-panels.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/workbench-drawing-inspector.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/workbench-workspace-tabs.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/ui/ChartFrameShell.svelte`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/ui/PhaseOneMarketChartSurface.svelte`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/ui/TradingLedgerPanel.svelte`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/ui/WorkbenchDrawingInspectorPanel.svelte`
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md`

- [x] **Step 1: Inventory public and UI comments**

Run:

```bash
rg -n "^\s*(//|/\*|\*|<!--)" \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public \
  /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/ui
```

Expected: comment-bearing locations across public contracts and reusable Svelte shells.

- [x] **Step 2: Audit whether comments still match the library-first split**

While reading the files, specifically flag comments that still imply:

- library code is “demo-only”
- example-owned paths are the public truth
- a component is temporary when it is now library-owned
- behavior belongs to the host when it has already moved into the package

Add each finding to either the `Public Surface` or `Reusable UI` table in the audit report.

- [x] **Step 3: Record any export-surface comment gaps**

If you find a public barrel or UI shell whose code is now self-explanatory but still lacks one critical boundary note, add a report row with `REWRITE-NOW` rather than drafting the comment immediately. This audit pass must record the gap, not fix it.

- [x] **Step 4: Commit the public-and-ui findings**

Run:

```bash
git -C /Users/dev/workspace2/hc_apps/chartx2 add docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md
git -C /Users/dev/workspace2/hc_apps/chartx2 commit -F - <<'EOF'
docs(chartx2-comments): audit public-surface and reusable-ui comments

Extend the comment audit into the package-owned public seams and reusable Svelte shells so stale demo language and missing boundary notes are recorded before any direct comment rewrites begin.

Changes:
- inspect the core public barrels and selected reusable UI shells
- classify stale, missing, or redundant comments under the public-surface and reusable-ui sections
- keep the audit report aligned with the library-first split now established in the repo

Verification:
- rg -n "Public Surface|Reusable UI" /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md (PASS)

Not included:
- no example-host findings are recorded in this commit
- no comment rewrites are applied yet
EOF
```

Expected: one docs-only commit created with public/UI findings.

### Task 4: Audit Example Host And Test Comments For Boundary Drift

**Files:**
- Read: `/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/lib/example-app/chartx-demo.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/lib/example-app/workbench-fixtures.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/lib/example-app/performance-demo.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/lib/example-app/components/MarketWorkbenchPanel.svelte`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/routes/+layout.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/routes/+page.svelte`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/routes/chartx/public/+server.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/tests/unit/library-public-consumer.test.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/tests/unit/library-split-boundary.test.ts`
- Read: `/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/tests/visual/phase-one-harness.spec.ts`
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md`

Execution note:
- this pass recorded explicit findings for `+layout.ts`, `+page.svelte`, `chartx-demo.ts`, `workbench-fixtures.ts`, and `tests/unit/library-split-boundary.test.ts`
- the other listed Task 4 files were inventoried during execution but did not produce standalone comment findings worth separate audit rows in this pass

- [x] **Step 1: Inventory example-host comments**

Run:

```bash
rg -n "^\s*(//|/\*|\*|<!--)" \
  /Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/lib/example-app \
  /Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/routes \
  /Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/tests
```

Expected: comment-bearing lines in the example host and its tests.

- [x] **Step 2: Flag comments that still blur library and example ownership**

Add report rows for comments that incorrectly imply:

- example fixtures are product truth rather than showcase data
- example routes own library internals
- test comments assert behavior that moved into package-owned UI
- stale `demo` wording survives where the repo has already standardized on `example-app`

- [x] **Step 3: Add one remediation-order list based on risk**

Under `Suggested Remediation Order`, replace `None yet.` with an ordered list like this, adjusted to the real findings:

```md
1. Rewrite stale library-vs-example ownership comments in the example host.
2. Delete low-signal comments that merely narrate fixtures or obvious Svelte event wiring.
3. Patch high-value missing boundary notes in package-owned runtime entrypoints after the audit is complete.
```

- [x] **Step 4: Commit the example-host findings**

Run:

```bash
git -C /Users/dev/workspace2/hc_apps/chartx2 add docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md
git -C /Users/dev/workspace2/hc_apps/chartx2 commit -F - <<'EOF'
docs(chartx2-comments): audit example-host and test comments

Finish the comment audit by checking the example host and tests for stale ownership language and low-value narration that survived the library-first split.

Changes:
- inspect the example runtime controllers, fixtures, route shell, and key tests
- record stale boundary comments and low-signal narration under the example-host section
- replace the placeholder remediation order with a concrete next-pass sequence

Verification:
- rg -n "Example Host|Suggested Remediation Order" /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md (PASS)

Not included:
- no source comments are rewritten in this commit
- no remediation patchset is started yet
EOF
```

Expected: one docs-only commit created with example-host findings and remediation order.

### Task 5: Final Audit Sanity Pass And Handoff

**Files:**
- Modify: `/Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md`

- [x] **Step 1: Re-read the completed audit report for duplicate or conflicting findings**

Run:

```bash
sed -n '1,240p' /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md
```

Expected: one coherent audit report without placeholder rows or contradictory action labels.

- [x] **Step 2: Check that every audited subsystem has at least one explicit summary or an explicit “no issues found” note**

Run:

```bash
rg -n "### 1\\. Library Internals|### 2\\. Public Surface|### 3\\. Reusable UI|### 4\\. Example Host" /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md
```

Expected: all four subsystem headings present.

- [x] **Step 3: Verify the audit report is the only changed tracked artifact**

Run:

```bash
git -C /Users/dev/workspace2/hc_apps/chartx2 status --short
```

Expected: only the audit report (and optionally this plan if you check boxes in place) appears before the final commit.

- [x] **Step 4: Commit the final audited report state**

Run:

```bash
git -C /Users/dev/workspace2/hc_apps/chartx2 add docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md docs/superpowers/plans/2026-05-12-chartx2-comment-audit-plan.md
git -C /Users/dev/workspace2/hc_apps/chartx2 commit -F - <<'EOF'
docs(chartx2-comments): finalize the first comment-audit report

Land the full comment audit as a durable repo artifact so later remediation can happen in narrow, reviewable slices against a checked-in findings list.

Changes:
- complete the cross-subsystem chartx2 comment audit report
- classify findings across internals, public surface, reusable UI, and example host
- capture remediation ordering without mixing source rewrites into the audit pass

Verification:
- sed -n '1,240p' /Users/dev/workspace2/hc_apps/chartx2/docs/superpowers/audits/2026-05-12-chartx2-comment-audit.md (PASS)
- git -C /Users/dev/workspace2/hc_apps/chartx2 status --short (PASS)

Not included:
- no comment rewrite or deletion patches are included in this commit
- no AGENTS or architecture-doc wording changes are bundled into the audit pass
EOF
```

Expected: one final docs-only commit with the completed audit report.

## Self-Review

- Spec coverage: this plan covers audit artifact creation, internal engine review, public/UI review, example-host review, and final closeout. It does not include comment rewrites because the user asked for an audit plan first.
- Placeholder scan: no `TBD`, `TODO`, or “similar to above” placeholders remain; all tasks use exact file paths and exact commands.
- Type consistency: the plan does not invent new runtime APIs. It only introduces one audit report path and uses that path consistently in every task.
