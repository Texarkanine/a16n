# Task Archive: Split Read/Write Directories & Path Reference Rewriting

## Metadata
- **Complexity**: Level 3
- **Type**: Multi-package Feature (CLI, Engine, Models)
- **Date Completed**: 2026-02-08
- **Branch**: `pathing`
- **PR**: #42

## Summary

Two related enhancements to a16n that decouple read/write directories and enable automatic path reference rewriting during conversions:

1. **`--from-dir` / `--to-dir` CLI flags** — Allow separate source (read) and target (write) directories, decoupling the single `[path]` positional argument into independent inputs.
2. **`--rewrite-path-refs` flag** — When converting between formats, find file path references in content that point to source-format files being converted, and update them to the corresponding target-format paths. Warn about orphan references (source-format paths that aren't in the conversion set).

Changes spanned three packages (`@a16njs/models`, `@a16njs/engine`, `a16n` CLI) plus comprehensive documentation updates across the docs site, README, and ROADMAP. No new dependencies were introduced.

## Requirements

### Feature 1: `--from-dir` / `--to-dir` (12 requirements — all met)

- R1.1–R1.4: `--from-dir` overrides discover root, `--to-dir` overrides emit root, positional `[path]` is the fallback, flags work independently or together
- R1.5–R1.6: `--from-dir` works on both `convert` and `discover`; `--to-dir` is `convert` only
- R1.7–R1.8: `--delete-source` uses source root; `--gitignore-output-with` uses target root
- R1.9–R1.10: Both flags validate directory existence; positional arg is fallback
- R1.11–R1.12: Documentation and error messages guide users

### Feature 2: `--rewrite-path-refs` (14 requirements — all met)

- R2.1–R2.4: Boolean flag, builds source→target mapping, exact replacement, longest-first ordering
- R2.5–R2.7: Strict mode (only rewrite converted paths), orphan detection, target orphan detection
- R2.8–R2.11: Works with `--dry-run`, `--from-dir`/`--to-dir`, extension changes, directory flattening
- R2.12–R2.14: No false positives, clear warning messages, acceptable performance

## Implementation

### Approach

The feature was implemented in 6 phases following TDD methodology:

1. **Models** — Added `WarningCode.OrphanPathRef` to the warnings enum
2. **Engine — Split Roots** — Added `sourceRoot?` and `targetRoot?` to `ConversionOptions`; `convert()` uses `sourceRoot ?? root` for discover, `targetRoot ?? root` for emit
3. **Engine — Path Rewriter** — Created new `path-rewriter.ts` module with three pure functions; wired into engine via a two-pass emit pattern (dry-run → mapping → rewrite → real emit)
4. **CLI — Flags** — Added `--from-dir`, `--to-dir`, `--rewrite-path-refs` options; updated directory validation, `--delete-source`, and `--gitignore-output-with` to use split roots
5. **Integration Testing** — End-to-end tests with real plugins and file I/O
6. **Documentation** — Updated CLI overview, engine overview, models, FAQ, understanding-conversions, README, and ROADMAP

### Key Design Decisions

- **Split roots at engine level**: `ConversionOptions` gets `sourceRoot?` / `targetRoot?` falling back to `root`. No plugin interface changes required — plugins already accept a `root` parameter.
- **Two-pass emit for path rewriting**: Dry-run emit → build mapping → rewrite content → real emit. Reuses existing `dryRun: true` capability; first pass is cheap (no file I/O).
- **Longest-match-first replacement**: Prevents partial match corruption (e.g., `.cursor/rules/auth` matching inside `.cursor/rules/auth.mdc`).
- **Clone before mutate**: Items are cloned before content rewriting to prevent aliasing bugs.
- **`PLUGIN_PATH_PATTERNS` in engine**: Hard-coded map of known plugin directory prefixes and file extensions for orphan detection. Avoids modifying the plugin interface at the cost of mild coupling.

### Key Components

- **`packages/engine/src/path-rewriter.ts`** (NEW) — `buildMapping()`, `rewriteContent()`, `detectOrphans()` — pure, stateless functions
- **`packages/engine/src/index.ts`** — `ConversionOptions` extended with `sourceRoot`, `targetRoot`, `rewritePathRefs`; two-pass emit logic; `PLUGIN_PATH_PATTERNS`
- **`packages/cli/src/index.ts`** — `--from-dir`, `--to-dir`, `--rewrite-path-refs` flags; directory validation; split root resolution throughout all post-conversion operations
- **`packages/cli/src/output.ts`** — `OrphanPathRef` icon and hint
- **`packages/models/src/warnings.ts`** — `WarningCode.OrphanPathRef`

### Files Changed

| Package | File | Change |
|---------|------|--------|
| `@a16njs/models` | `src/warnings.ts` | Added `OrphanPathRef` warning code |
| `@a16njs/engine` | `src/index.ts` | Extended `ConversionOptions`; two-pass emit; `PLUGIN_PATH_PATTERNS` |
| `@a16njs/engine` | `src/path-rewriter.ts` | **NEW** — `buildMapping`, `rewriteContent`, `detectOrphans` |
| `a16n` CLI | `src/index.ts` | Three new flags; split root resolution; updated all post-conversion operations |
| `a16n` CLI | `src/output.ts` | Warning icon + hint for `OrphanPathRef` |
| docs | `cli/index.md` | Examples, "Split Directories" section, "Path Reference Rewriting" section |
| docs | `engine/index.md` | API examples, two-pass architecture diagram, `ConversionOptions` table |
| docs | `models/index.md` | Warning code table updated |
| docs | `understanding-conversions/index.md` | Warning codes + "Path Reference Rewriting" section |
| docs | `faq.md` | Two new FAQ entries |
| root | `README.md` | Quick start examples updated |
| root | `planning/ROADMAP.md` | Completed phases table + decision log |

### CodeRabbit Feedback (2 rounds, all resolved)

**Round 1 (commit 8e441e9):**
- Merged real emission warnings (was dropping them when `rewritePathRefs` enabled)
- Added chained-replacement safety comment
- Deduplicated orphan warnings for repeated references
- Simplified test helper

**Round 2 (commit 43668a1):**
- Improved error message for "not a directory" vs "does not exist"
- Made `--to-dir` a hidden option on `discover` (for unreachable-code guard)
- Guarded `detectOrphans` against empty prefix/extension arrays

**Consciously ignored:** `PLUGIN_PATH_PATTERNS` coupling (acceptable trade-off), unused `_discovered`/`_sourceRoot` params (underscore convention).

## Testing

**37 new tests** across four layers, all passing:

| Layer | Count | Tests | Coverage |
|-------|-------|-------|----------|
| Unit (PathRewriter) | 13 | P1–P13 | `buildMapping`, `rewriteContent`, `detectOrphans` — all branches |
| Engine Integration | 8 | E1–E4, EP1–EP4 | Split roots + rewrite wiring |
| CLI Unit | 10 | C1–C8 + rewrite | Flag parsing, validation, error messages |
| CLI Integration | 6 | I1–I3, CI1–CI3 | End-to-end with real plugins and file I/O |

**Final verification:**
- Build: All 7 packages build (15/15 turbo tasks)
- Tests: All pass across all packages (126 CLI, 33 engine, 92 models, 108 plugin-claude, 112 plugin-cursor, 37 glob-hook, 78 plugin-a16n, 31 docs)
- Lint: No errors in modified files

## Lessons Learned

### Technical
- **Two-pass patterns are cheap when the first pass is side-effect-free.** The dry-run emit skips all file I/O. Reusable for any feature that needs to "peek" at output before committing.
- **Longest-match-first replacement is essential for path rewriting.** A simple `.sort((a, b) => b.length - a.length)` prevents partial match corruption entirely.
- **Clone before mutate.** The clone pattern for items before content rewriting prevented subtle aliasing bugs and should be a default practice.

### Process
- **CodeRabbit reviews add genuine value.** Both rounds produced actionable improvements — treating automated review as a real review cycle yields better code.
- **TDD + phased implementation = smooth delivery.** Each phase was independently verifiable; the test suite served as a living spec.
- **Documentation-last works when the feature is well-planned.** Because implementation closely followed the plan, docs were straightforward to write.

### What Could Improve
- The CLI file (`packages/cli/src/index.ts`) is getting large (~600 lines). Extracting the `convert` action into a separate module would reduce future change risk.
- `PLUGIN_PATH_PATTERNS` coupling should be replaced with plugin interface declarations when third-party plugins are supported.
- Warning deduplication should be designed in from the start for any content-scanning function.
- Warning code documentation tables should be auto-generated from the `WarningCode` enum.

## Future Considerations

1. **Extract CLI actions into modules** — Refactor `convert` action into `packages/cli/src/commands/convert.ts`
2. **Plugin path pattern declarations** — Add optional `pathPatterns` to `A16nPlugin` interface to eliminate hard-coded `PLUGIN_PATH_PATTERNS`
3. **In-process CLI testing** — Import action handlers directly for tests that don't need exit code/stdout verification, to reduce ~115s test time
4. **Auto-generate warning tables** — Script or Docusaurus plugin to generate docs from `WarningCode` enum

## References

- PR: https://github.com/Texarkanine/a16n/pull/42
