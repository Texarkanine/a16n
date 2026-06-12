# Decision: AGENTS.md Emission Idempotency & Overwrite Behavior

## Context

**What**: When `plugin-agentsmd` emits, multiple IR items may target the same `AGENTS.md` file (concatenation), and the target may already exist as a hand-authored file at a canonical user location (repo root or subdirectory). Decide: write semantics (overwrite / merge / append), concatenation format, ordering, and which warnings fire.

**Why it matters**: Issue #50 flags "text concatenation is an idempotency nightmare." A wrong choice either destroys user content silently (overwrite without warning) or grows files unboundedly on repeated conversion (append/merge). Unlike `.cursor/rules/` and `.claude/rules/` (tool-managed trees), `AGENTS.md` is a file users author by hand.

**Constraints**:
- Repeated emission of identical IR must be idempotent.
- Standard warning channels only (operator directive: no editorial warnings).
- Multiple items merged into one file must produce `WarningCode.Merged` (existing hint: "Converting back will produce 1 file, not the original count").
- Warn-and-continue philosophy (systemPatterns.md): fail fast on invalid input, warn on capability gaps; never silently lose information.

## Options Evaluated

- **Option A — Deterministic overwrite + `Overwritten` warning on content change**: output is a pure function of the IR; replacing a pre-existing, content-differing `AGENTS.md` fires `WarningCode.Overwritten`.
- **Option B — Merge into existing content** (à la plugin-claude's `settings.json` deny-rule merge): read existing AGENTS.md, append/dedupe converted chunks.
- **Option C — Refuse to write when target exists** (skip + warning), requiring manual deletion.

## Analysis

| Criterion | A: Overwrite + warn | B: Merge | C: Refuse |
|-----------|--------------------|----------|-----------|
| Idempotency | ✅ pure function of IR | ❌ dedupe needs chunk identity in free-form markdown — unsolvable without provenance markers | ✅ trivially |
| Data-loss visibility | ✅ `Overwritten` warning + `isNewFile: false` | ✅ no loss, but corrupts ordering/structure over runs | ✅ no loss |
| Consistency with codebase | ✅ every emitter overwrites its own outputs (`.mdc`, rules `.md`, `.cursorignore`) | ⚠️ only `settings.json` merges — and that is structured JSON, not prose | ❌ no precedent; breaks "convert just works" |
| Dry-run/`--delete-source` compatibility | ✅ unchanged | ⚠️ trial-emit (path rewriting) would re-read targets mid-pipeline | ⚠️ conversion silently incomplete |
| Simplicity | ✅ | ❌ | ✅ |

Key insights:

- Markdown has no reliable chunk identity, so B's dedupe can only work with provenance markers (HTML comments) embedded in the output — pollution of a file whose entire value is being clean, universal markdown. That kills B.
- C breaks the primary use case: re-running a conversion after editing sources is normal workflow; refusing on every second run makes the plugin useless without `--force`-style flags the operator explicitly declined.
- The unused `WarningCode.Overwritten` (`'overwritten'`, icon `↺`) exists in `@a16njs/models` precisely for "existing file was replaced" — this is its first legitimate use.
- Suppressing the warning when the written content is byte-identical to the existing content keeps repeated runs warning-stable (true idempotency, including diagnostics).

## Decision

**Selected**: Option A — deterministic overwrite; `Overwritten` warning iff a pre-existing file's content actually changes.

**Rationale**: Only A is simultaneously idempotent, precedent-consistent, and honest about data loss through the standard warning channel. The "idempotency nightmare" dissolves once emission is a pure function of the IR: repeated emission converges instead of accumulating.

**Tradeoff**: A hand-authored `AGENTS.md` at a target path is replaced (loudly). Users who want to preserve hand-written content must move it into the source format first — which is exactly the conversion-centric worldview a16n already has.

## Implementation Notes

- **Grouping**: bucket emittable items by target file: root `AGENTS.md` ← all plain GlobalPrompts; `<dir>/AGENTS.md` ← nested-CLAUDE.md-style GlobalPrompts (per creative-agentsmd-ir-mapping) and dir-shaped FileRules for that dir.
- **Concatenation format**: `content.trim()` of each item, joined with `'\n\n'`, single trailing `'\n'` at EOF. No separators, no headers, no provenance comments (operator: no editorial content). Order = input order (deterministic: discovery order of the source plugin).
- **Warnings**:
  - `Merged` when a file receives >1 item: message `Merged N items into <relpath>`, sources = contributing sourcePaths.
  - `Overwritten` when `isNewFile === false` and new content ≠ existing content: message `Replaced existing <relpath>`, sources = contributing sourcePaths.
- **WrittenFile**: one per target file; `itemCount` = number of contributing items; `sourceItems` = all contributors (keeps `--delete-source` and git-ignore match-mode correct).
- **Dry-run**: compute everything, write nothing — including the existing-content comparison (read is allowed in dry-run).
