# Task: Split Read/Write Directories & Path Reference Rewriting

## Description

Two enhancements to a16n:

1. **`--from-dir` / `--to-dir` CLI flags** — Allow separate source (read) and target (write) directories, decoupling the single `[path]` positional argument into independent inputs.
2. **`--rewrite-path-refs` flag** — When converting between formats, find file path references in content that point to source-format files being converted, and update them to the corresponding target-format paths. Warn about orphan references (source-format paths that aren't in the conversion set).

## Complexity

Level: 3
Type: Multi-package Feature (CLI, Engine, Models)

---

## Requirements Analysis

### Feature 1: `--from-dir` / `--to-dir`

**Functional Requirements:**
- [x] R1.1: `--from-dir <dir>` overrides the directory used for `discover()` (reading)
- [x] R1.2: `--to-dir <dir>` overrides the directory used for `emit()` (writing)
- [x] R1.3: Positional `[path]` arg remains as default for both (backward compatible)
- [x] R1.4: Flags can be used independently (`--from-dir` only, `--to-dir` only, or both)
- [x] R1.5: `--from-dir` applies to both `convert` and `discover` commands
- [x] R1.6: `--to-dir` applies to `convert` command only
- [x] R1.7: `--delete-source` operates against the source root (from-dir)
- [x] R1.8: `--gitignore-output-with` operates against the target root (to-dir)
- [x] R1.9: Both flags validate that the given directory exists and is a directory
- [x] R1.10: When both flags are used, `[path]` positional arg is ignored (or serves as fallback)

**Non-Functional Requirements:**
- [x] R1.11: Clear documentation on flag interaction and precedence
- [x] R1.12: Error messages guide users to correct usage

### Feature 2: `--rewrite-path-refs`

**Functional Requirements:**
- [x] R2.1: Boolean flag `--rewrite-path-refs` on the `convert` command
- [x] R2.2: Build a sourcePath → targetPath mapping from all converted items
- [x] R2.3: Replace exact occurrences of source paths in item content with target paths
- [x] R2.4: Sort replacements longest-first to prevent partial matches
- [x] R2.5: Only rewrite paths to files that ARE being converted (strict mode)
- [x] R2.6: Warn about "orphan" references — strings that look like source-format paths but aren't in the mapping
- [x] R2.7: Warn about target paths that reference files not present in the output set
- [x] R2.8: Works with `--dry-run` (report what would be rewritten)
- [x] R2.9: Works with `--from-dir` / `--to-dir`
- [x] R2.10: Handles file extension changes (e.g., `.mdc` → `.md`)
- [x] R2.11: Handles directory flattening (e.g., `.cursor/rules/shared/niko/foo.mdc` → `.claude/rules/foo.md`)

**Non-Functional Requirements:**
- [x] R2.12: No false positives — paths not in the mapping are untouched
- [x] R2.13: Clear warning messages for orphan references
- [x] R2.14: Performance: O(items × mappings) — acceptable for typical project sizes

---

## Component Analysis

### Affected Packages & Files

#### `@a16njs/engine` (packages/engine/)
- **`src/index.ts`** — `ConversionOptions` gains `sourceRoot?` and `targetRoot?`; `convert()` uses split roots; new `rewritePathRefs` option triggers content rewriting between discover and emit
- **NEW `src/path-rewriter.ts`** — Core path rewriting logic: builds mapping, rewrites content, detects orphans

#### `@a16njs/models` (packages/models/)
- **`src/warnings.ts`** — New `WarningCode.OrphanPathRef` for orphan reference detection
- **`src/index.ts`** — Re-export new warning code
- **`src/plugin.ts`** — No changes needed (plugins already accept `root` parameter)

#### `a16n` CLI (packages/cli/)
- **`src/index.ts`** — Add `--from-dir`, `--to-dir`, `--rewrite-path-refs` flags; resolve split roots; pass to engine
- **`src/output.ts`** — May need formatting for rewrite warnings

#### No plugin changes required
- Plugins already accept a `root` parameter for both `discover()` and `emit()`
- The engine handles the split by passing different roots to each plugin method

### Component Interaction Diagram

```
CLI (index.ts)
  ├── Parses --from-dir, --to-dir, --rewrite-path-refs
  ├── Resolves sourceRoot & targetRoot
  └── Calls engine.convert({ sourceRoot, targetRoot, rewritePathRefs })

Engine (index.ts)
  ├── discover(sourceRoot) → items with sourcePath
  ├── IF rewritePathRefs:
  │   ├── dryRun emit(items, targetRoot) → WrittenFile[] with paths
  │   ├── PathRewriter.buildMapping(items, writtenFiles, sourceRoot, targetRoot)
  │   ├── PathRewriter.rewriteContent(items, mapping) → rewritten items
  │   └── PathRewriter.detectOrphans(items, mapping, sourcePluginId) → warnings
  ├── emit(rewrittenItems, targetRoot) → WrittenFile[]
  └── Returns ConversionResult with rewrite warnings

PathRewriter (path-rewriter.ts)
  ├── buildMapping(): sourcePath → targetRelativePath
  ├── rewriteContent(): exact string replacement in item.content
  └── detectOrphans(): regex scan for remaining source-format paths
```

---

## Test Planning (TDD)

### Behaviors to Test

#### Feature 1: --from-dir / --to-dir

**Engine tests** (`packages/engine/test/engine.test.ts`):
- E1: `convert()` with `sourceRoot` passes it to `discover()`
- E2: `convert()` with `targetRoot` passes it to `emit()`
- E3: `convert()` with both split roots uses correct root for each
- E4: `convert()` with only `root` (no split) maintains backward compat
- E5: `discover()` method accepts and uses a root parameter (already works)

**CLI tests** (`packages/cli/test/cli.test.ts`):
- C1: `--from-dir` flag is parsed and passed correctly
- C2: `--to-dir` flag is parsed and passed correctly
- C3: Both flags together work correctly
- C4: `--from-dir` with nonexistent directory produces error
- C5: `--to-dir` with nonexistent directory produces error
- C6: `--from-dir` on `discover` command works
- C7: `--to-dir` on `discover` command produces error (not applicable)
- C8: `--delete-source` uses sourceRoot, not targetRoot
- C9: `--gitignore-output-with` uses targetRoot

**Integration tests** (`packages/cli/test/integration/integration.test.ts`):
- I1: Convert with `--from-dir` reads from specified source, writes to positional arg
- I2: Convert with `--to-dir` reads from positional arg, writes to specified target
- I3: Convert with both reads from `--from-dir`, writes to `--to-dir`

#### Feature 2: --rewrite-path-refs

**PathRewriter unit tests** (`packages/engine/test/path-rewriter.test.ts` — NEW):
- P1: `buildMapping()` correctly maps sourcePaths to relative target paths
- P2: `buildMapping()` handles merged files (multiple sources → one target)
- P3: `buildMapping()` handles extension changes (`.mdc` → `.md`)
- P4: `buildMapping()` handles directory flattening
- P5: `rewriteContent()` replaces exact source path with target path
- P6: `rewriteContent()` handles multiple replacements in one content string
- P7: `rewriteContent()` replaces longest match first (no partial match corruption)
- P8: `rewriteContent()` leaves non-matching paths untouched
- P9: `rewriteContent()` handles self-references (file referencing itself)
- P10: `detectOrphans()` finds source-format paths not in mapping
- P11: `detectOrphans()` does not false-positive on mapped paths
- P12: `detectOrphans()` returns warning with file path and orphan string
- P13: Rewritten items are clones (originals not mutated)

**Engine integration tests** (`packages/engine/test/engine.test.ts`):
- EP1: `convert()` with `rewritePathRefs: true` rewrites content
- EP2: `convert()` with `rewritePathRefs: true` includes orphan warnings
- EP3: `convert()` with `rewritePathRefs: false` (default) doesn't rewrite
- EP4: `convert()` with `rewritePathRefs: true` + `dryRun: true` reports rewrites without writing

**CLI integration tests** (`packages/cli/test/integration/integration.test.ts`):
- CI1: Cursor→Claude with `--rewrite-path-refs` rewrites `.cursor/rules/...` → `.claude/rules/...`
- CI2: Cursor→Claude with `--rewrite-path-refs` warns about orphan refs
- CI3: Combined `--from-dir` + `--to-dir` + `--rewrite-path-refs` works end-to-end

### Test Infrastructure
- Test framework: Vitest (existing)
- Existing test files: `packages/engine/test/engine.test.ts`, `packages/cli/test/cli.test.ts`, `packages/cli/test/integration/integration.test.ts`
- New test file: `packages/engine/test/path-rewriter.test.ts`
- New fixtures: `packages/cli/test/integration/fixtures/` for path-rewriting scenarios

---

## Technology Stack

No new dependencies required. All changes use existing:
- TypeScript (strict)
- Vitest for testing
- Commander for CLI
- Node.js `path` module for path manipulation
- Existing `@a16njs/models` helpers (`sanitizeFilename`, `getUniqueFilename`)

### Technology Validation
- [x] Project builds with `pnpm build`
- [x] Existing tests pass with `pnpm test`
- [x] No new dependencies to install

---

## Implementation Plan

### Phase 1: Models — New Warning Code (small, enables both features)

1. Add `OrphanPathRef` to `WarningCode` enum in `packages/models/src/warnings.ts`
2. Verify re-export in `packages/models/src/index.ts`

### Phase 2: Engine — Split Roots (Feature 1 core)

1. Update `ConversionOptions` to add optional `sourceRoot` and `targetRoot`
2. Update `convert()` to:
   - Use `sourceRoot ?? root` for `discover()`
   - Use `targetRoot ?? root` for `emit()`
3. Write engine tests (E1-E5)

### Phase 3: Engine — Path Rewriter (Feature 2 core)

1. Create `packages/engine/src/path-rewriter.ts` with:
   - `buildMapping(discovered, written, sourceRoot, targetRoot)` → `Map<string, string>`
   - `rewriteContent(items, mapping)` → cloned items with rewritten content
   - `detectOrphans(items, mapping, sourcePluginPrefixes)` → `Warning[]`
2. Wire `rewritePathRefs` option into `ConversionOptions`
3. Update `convert()` to implement the two-pass pattern:
   - Dry-run emit → build mapping → rewrite → real emit
4. Write PathRewriter unit tests (P1-P13)
5. Write engine integration tests (EP1-EP4)

### Phase 4: CLI — Add Flags (both features)

1. Add `--from-dir <dir>` and `--to-dir <dir>` options to `convert` command
2. Add `--from-dir <dir>` option to `discover` command
3. Add `--rewrite-path-refs` flag to `convert` command
4. Implement directory resolution logic:
   - If `--from-dir`: `sourceRoot = resolve(fromDir)`, validate
   - If `--to-dir`: `targetRoot = resolve(toDir)`, validate
   - Positional `[path]` fills in whichever isn't set
5. Update `engine.convert()` call to pass split roots and rewritePathRefs
6. Update `--delete-source` to use `sourceRoot`
7. Update `--gitignore-output-with` to use `targetRoot`
8. Update output formatting for rewrite-related warnings
9. Write CLI tests (C1-C9)

### Phase 5: Integration Testing

1. Create fixtures for split-directory scenarios
2. Create fixtures for path-rewriting scenarios (cursor rules referencing each other)
3. Write integration tests (I1-I3, CI1-CI3)
4. Run full test suite

### Phase 6: Documentation

1. Update CLI help text for new flags
2. Update docs site if applicable

---

## Challenges & Mitigations

| Challenge | Mitigation |
|-----------|------------|
| Two-pass emit performance | Dry-run is cheap (no I/O writes); acceptable for typical project sizes |
| Partial path matches | Sort replacements longest-first; exact string matching only |
| Directory flattening changes paths | Mapping is built from actual emit output, so flattening is already reflected |
| Content mutation side effects | Clone items before rewriting; originals untouched |
| Orphan detection false positives | Only flag strings that contain known source plugin directory prefixes AND file extensions |
| `--delete-source` with split roots | Delete from `sourceRoot`, not `targetRoot`; path validation prevents cross-root deletion |
| `--gitignore-output-with match` needs git repo | Validate against `targetRoot` for git repo checks |
| Dry-run + rewrite-path-refs | Run the internal dry-run for mapping, report what WOULD be rewritten |

---

## Creative Phases Required

- [x] **Path Rewriting Algorithm** — Design is complete (documented above): exact-match replacement with longest-first ordering, two-pass emit approach, orphan detection via regex scanning. No remaining design ambiguity.

No additional creative phases needed — the design decisions are well-constrained by the user's requirements.

---

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Planning complete
- [x] Technology validation complete (no new deps)
- [ ] Phase 1: Models — New Warning Code
- [ ] Phase 2: Engine — Split Roots
- [ ] Phase 3: Engine — Path Rewriter
- [ ] Phase 4: CLI — Add Flags
- [ ] Phase 5: Integration Testing
- [ ] Phase 6: Documentation
