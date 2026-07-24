# alpha2 W4：chartx2 row-time focus public seam closure

> Closure date: 2026-07-25
> Closed implementation range: `b4362000..13b5c57`
> Closure scope: documentation only; no source, build artifact, API, or push change

## Final verdict

```text
GO
P0 = 0
P1 = 0
P2 = 0
```

The narrow public seam is closed for chartx2. `PhaseOneTimeScaleApi.focusTime`
remains time-scale-owned, resolves only against the active axis, exposes no
logical/internal handle, and has five normal result kinds. This closure does not
claim alpha2 product integration or production trading proof.

## Auditable history

| Commit | Tutorial | Outcome |
|---|---:|---|
| `b4362000` | 0393 | Frozen plan and Sol review history |
| `00e6eeb` | 0394 | Added the minimal public row-time focus seam |
| `13b5c57` | 0395 | Fixed packed-consumer compatibility evidence after fresh NO-GO |
| this closure | 0396 | Records the final review chain without changing implementation |

The first implementation review was NO-GO: P0=0, P1=1, P2=1. Its two findings
were limited to the release verifier: the established
`@chartx2/library/workbench-drawing-inspector` subpath was no longer exercised,
and the packed type probe did not exhaust all five result variants. `13b5c57`
restored both proofs without expanding the seam. Fresh re-review returned the
final GO above.

## Evidence retained

- `pnpm check`, `pnpm test:unit`, `pnpm release:local:verify`, and
  `pnpm release:local:check` passed in the implementation/review record.
- Library unit evidence was 163 files / 572 tests; example evidence was 4 files
  / 16 tests.
- The clamp mutation made the focused source unit and packed browser gate RED,
  then the exact revert returned both to GREEN. The focused inspector-subpath
  removal mutation made the packed verifier RED, then restored GREEN.
- The temp consumer used its own dependencies, Vite HTTP, Chromium and a real
  canvas; cleanup left no `/tmp/chartx2-release-consumer-*` residue.
- `git diff --check b4362000..13b5c57` passed.
- The verified release artifact is SHA-256
  `ed3dc752116b51ca5ae11c1fbbc30042395b38015d424acb3a533e9113cf9b4b` and
  SHA-512
  `d03227aa9c4cf620c40af29ef4dd42fba7ac03de43038eca5f2e74f986b6b919efe6a216eccbdc8733a0787a278ea39e90dea77772d70ccd007dc69e3f4b0e12`.

## Compatibility and next gate

The root API is source-compatible for ordinary consumers except for the explicit
pre-1.0 full-interface mock migration caused by required `focusTime`; that
migration is intentionally compile-visible. Existing public root and focused
inspector-subpath packed-consumer coverage are both retained.

This task does not push. After normal push, alpha2 may consume the verified tgz
only through `@chartx2/library`. Its next consumer gate must prove canonical fill
`ts_ms` and curve time use the same unit, pass an explicit curve-aware
`maxDistance`, exhaustively handle all five result kinds, and avoid private
imports, logical-index math, or `locateTrade` substitution.

## Out of scope

No API redesign, marker/trade/selection state, price-scale or persistence work,
alpha2 source change, Tauri/Rust work, or build-artifact rewrite is included.
