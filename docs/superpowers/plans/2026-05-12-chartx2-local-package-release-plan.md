# Chartx2 Local Package Release Implementation Record

Date: 2026-05-12

## Goal

Make `chartx2` consumable as a locally released package and switch `alpha2`
from a long-lived source `link:` dependency to a concrete tarball dependency.

The intended boundary is:

- `chartx2/packages/chartx2` owns the publishable chart library.
- `chartx2/examples/tauri-svelte` remains the official example app.
- `alpha2` consumes `@chartx2/library` through the package boundary, not through
  raw source paths or example-owned modules.

## Final Architecture

`@chartx2/library` now resolves from built `dist` artifacts instead of raw
`src/lib/public/*.ts` paths.

The local release flow is:

1. Run `pnpm release:local` from `/Users/dev/workspace2/hc_apps/chartx2`.
2. The script builds `packages/chartx2`.
3. The script packs `@chartx2/library`.
4. The generated tarball lands under:

```text
/Users/dev/workspace2/hc_apps/build/chartx2/
```

The current local artifact is:

```text
/Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
```

`alpha2` now consumes that artifact with:

```json
{
  "@chartx2/library": "file:../build/chartx2/chartx2-library-0.1.0.tgz"
}
```

## Commit Chain

### `chartx2`

- `bcef8c0` `refactor(chartx2-package): add package-facing source entry shims`
- `78ebc10` `test(chartx2-package): verify package-facing shims through real imports`
- `b72202d` `feat(chartx2-package): publish the library from built dist artifacts`
- `9e5bbff` `fix(chartx2-package): make the built dist entry graph consumer-loadable`
- `adeb183` `feat(chartx2-release): add a local tarball packaging flow`
- `d8f9ca4` `fix(chartx2-release): keep the last local tarball until a new pack succeeds`
- `29e966c` `docs(chartx2-release): document the local package release boundary`

### `alpha2`

- `cca080d` `refactor(alpha2-chartx2): consume the packaged chartx2 tarball`
- `a7192db` `fix(alpha2-chartx2): accept local tarball releases in the public-boundary test`
- `fe0caa1` `docs(alpha2-chartx2): codify released chartx2 package consumption`

## What Changed

### Package Entries

- Added package-facing source shims under `packages/chartx2/src/lib/`.
- Kept the implementation barrels under `packages/chartx2/src/lib/public/`.
- Added contract coverage so package-facing entries are checked through real
  imports rather than string-only assertions.

### Built Package Surface

- Changed package exports to point at `dist` artifacts.
- Added package build configuration for the library package.
- Added a package dist contract test.
- Hardened generated `dist` import specifiers so the Vite/Svelte consumer path
  resolves through the built package graph.

### Local Release Script

- Added `pnpm release:local` at the chartx2 workspace root.
- Added `scripts/pack-chartx2-local-release.mjs`.
- The script stages the new tarball first and only replaces the previous local
  tarball after a successful pack.

### Alpha2 Consumption

- Switched `alpha2/package.json` from `link:../chartx2/packages/chartx2` to the
  local tarball under `../build/chartx2/`.
- Refreshed `alpha2/pnpm-lock.yaml`.
- Updated the alpha2 chartx2 boundary test to accept local tarball dependencies.
- Kept `alpha2` imports restricted to `@chartx2/library` public exports.

### Documentation

- Documented the local release flow in `chartx2/README.md`.
- Codified package-first sibling-app consumption in `chartx2/AGENTS.md`.
- Codified packaged `chartx2` consumption in `alpha2/AGENTS.md`.
- Added commit tutorials:
  - `chartx2/tutorials/commit/0379-prepare-chartx2-for-local-package-release.md`
  - `alpha2/tutorials/commit/0202-switch-alpha2-to-chartx2-local-release-tarball.md`

## Verification

The implementation was verified across both repos during the slice sequence:

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 release:local` (PASS)
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit` (PASS)
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check` (PASS)
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build` (PASS)
- `pnpm -C /Users/dev/workspace2/hc_apps/alpha2 test:unit` (PASS)
- `pnpm -C /Users/dev/workspace2/hc_apps/alpha2 check` (PASS)
- `pnpm -C /Users/dev/workspace2/hc_apps/alpha2 build` (PASS)
- `test -f /Users/dev/workspace2/hc_apps/tradeblazer/Cargo.toml` (PASS)
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check` (PASS)
- `git -C /Users/dev/workspace2/hc_apps/alpha2 diff --check` (PASS for the
  task-owned files)

## Review Notes

The work followed the `Subagent-Driven` flow:

- implementer subagents handled bounded slices
- spec reviewers checked plan coverage
- code-quality reviewers checked practical risks
- reviewer findings were fixed in follow-up commits

Notable findings that were fixed:

- package entry tests initially checked file existence rather than real imports
- generated `dist` files initially had consumer-loadability issues
- the local release script initially removed the previous tarball before proving
  the new pack succeeded
- alpha2 boundary tests initially only accepted the old source-link dependency
- docs initially recorded verification commands against `/Users/dev/workspace2/hc_apps`,
  which is not itself a git repo
- alpha2 docs still referenced the removed in-repo TradeBlazer path; they now
  point at `/Users/dev/workspace2/hc_apps/tradeblazer`

## Working Tree Notes

`alpha2` had unrelated dirty worktree state during this implementation. The
commits in this line only staged task-owned files:

- `package.json`
- `pnpm-lock.yaml`
- `src/lib/alpha-ui/chartx-host/chartx2-public-boundary.test.ts`
- `AGENTS.md` task hunks
- `tutorials/commit/0202-switch-alpha2-to-chartx2-local-release-tarball.md`

The unrelated `alpha2` edits were deliberately left untouched.

## Not Included

- no remote npm registry, GitHub Packages, or private registry publish flow yet
- no automated semver bump workflow between `chartx2` and `alpha2`
- no CI job that automatically packs `chartx2` and validates `alpha2` against
  the produced tarball
- no rule that forbids temporary source links during short local debugging
