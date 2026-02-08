# Memory Bank: Progress

## Implementation Progress

### Phase 1: Models — New Warning Code
- Status: **Complete**
- Added `WarningCode.OrphanPathRef = 'orphan-path-ref'` to warnings enum
- Updated CLI output formatter with icon and hint

### Phase 2: Engine — Split Roots
- Status: **Complete**
- Added `sourceRoot?` and `targetRoot?` to `ConversionOptions`
- `convert()` uses `sourceRoot ?? root` for discover, `targetRoot ?? root` for emit
- 4 new engine tests (E1-E4), all passing

### Phase 3: Engine — Path Rewriter
- Status: **Complete**
- Created `packages/engine/src/path-rewriter.ts` with:
  - `buildMapping()` — derives source→target path map from WrittenFile.sourceItems
  - `rewriteContent()` — longest-first exact string replacement, items cloned
  - `detectOrphans()` — regex scan for source-format paths not in mapping
- Wired `rewritePathRefs` into engine's `convert()` via two-pass emit pattern
- Added `PLUGIN_PATH_PATTERNS` for well-known plugin directory/extension patterns
- 13 unit tests (P1-P13) + 4 engine integration tests (EP1-EP4), all passing

### Phase 4: CLI — Add Flags
- Status: **Complete**
- `convert` command: `--from-dir <dir>`, `--to-dir <dir>`, `--rewrite-path-refs`
- `discover` command: `--from-dir <dir>` (rejects `--to-dir`)
- Directory validation for both flags
- `--delete-source` uses `resolvedSourceRoot`
- `--gitignore-output-with` uses `resolvedTargetRoot`
- 10 new CLI tests (C1-C8 + rewrite-path-refs), all passing

### Phase 5: Integration Testing
- Status: **Complete**
- 3 split-directory integration tests (I1-I3)
- 3 path-rewriting integration tests (CI1-CI3)
- All 6 tests passing

### Phase 6: Documentation
- Status: **Complete**
- CLI help text included inline with Commander option declarations
- `convert --help` and `discover --help` show all new flags
- Documentation site updates:
  - **CLI Overview** (`packages/docs/docs/cli/index.md`): Added examples, "Split Directories" section, "Path Reference Rewriting" section
  - **Engine Overview** (`packages/docs/docs/engine/index.md`): Added split directories + path rewriting Quick Start examples, two-pass architecture diagram, `ConversionOptions` table
  - **Models Overview** (`packages/docs/docs/models/index.md`): Added `version-mismatch` and `orphan-path-ref` to warning code table
  - **Understanding Conversions** (`packages/docs/docs/understanding-conversions/index.md`): Added `boundary-crossing`, `git-status-conflict`, `version-mismatch`, `orphan-path-ref` to warning code table; added "Path Reference Rewriting" section
  - **FAQ** (`packages/docs/docs/faq.md`): Added entries for split directories and path rewriting
  - **README** (`README.md`): Added `--from-dir`/`--to-dir` and `--rewrite-path-refs` examples to Quick Start
  - **ROADMAP** (`planning/ROADMAP.md`): Added "Split Directories & Path Rewriting" to Completed Phases table and Decision Log

## Current Blockers
None

## Final Verification
- Build: All 7 packages build successfully (15/15 turbo tasks)
- Tests: All tests pass across all packages
- Lint: No linter errors in modified files
