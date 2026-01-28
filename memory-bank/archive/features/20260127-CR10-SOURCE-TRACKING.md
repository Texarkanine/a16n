# TASK ARCHIVE: CR-10 Source Tracking for WrittenFile

## METADATA

| Field | Value |
|-------|-------|
| Task ID | CR-10 |
| Date | 2026-01-27 |
| Complexity Level | Level 3 (Intermediate Feature) |
| Branch | phase-5 |

## SUMMARY

Added `sourceItems: AgentCustomization[]` field to the `WrittenFile` interface so the CLI can accurately determine which source files contributed to each output file. This enables proper git-ignore conflict detection in match mode when multiple sources merge into a single output.

## REQUIREMENTS

### Problem Statement
Match mode used a lossy heuristic (`discovered.filter(d => d.type === written.type)`) to guess which sources contributed to an output. This failed when multiple sources of the same type had different git status.

### Solution
Track source→output mapping accurately via `sourceItems` field, enabling:
- **Case 1:** Existing output - detect when sources don't match output's status
- **Case 2:** New output, unanimous sources - apply correct gitignore status
- **Case 3:** New output, conflicting sources - skip safely with warning

### Design Decision
**Originally planned:** Backwards compatibility fallback to type-based heuristic when `sourceItems` is missing

**Final decision:** Skip gitignore management entirely and emit warning when `sourceItems` is missing

**Rationale:** Without accurate source tracking, we cannot safely detect conflicts; better to be explicit than silently use inaccurate heuristic.

## IMPLEMENTATION

### Changes Across 4 Packages

| Package | File | Changes |
|---------|------|---------|
| models | `src/types.ts` | Added `sourceItems?: AgentCustomization[]` to WrittenFile |
| plugin-claude | `src/emit.ts` | Populate sourceItems during emit |
| plugin-cursor | `src/emit.ts` | Populate sourceItems during emit |
| cli | `src/index.ts` | Use sourceItems for conflict detection |

### New Warning Code
Added `GitStatusConflict` to `WarningCode` enum for conflict reporting.

## TESTING

- 16 new tests across 4 packages:
  - models: 5 tests (interface validation)
  - plugin-claude: 6 tests (sourceItems population)
  - plugin-cursor: 5 tests (sourceItems population)
  - cli: 4 stub tests (conflict detection scenarios)
- 309 total tests passing

## LESSONS LEARNED

### Technical
- Interface changes propagate cleanly with optional fields
- Skip rather than guess when data is missing
- Type system caught errors: adding to enum surfaced all Record usage

### Process
- TDD scales to multi-package changes
- User review is valuable - caught design flaw in backwards compat approach
- Phased approach (5 phases) made 4-package change manageable

### Architecture
- Clean separation: plugins provide data (`sourceItems`), CLI does conflict detection
- Warnings as communication: `GitStatusConflict` enables nuanced user feedback

### Key Insight
> "When adding features that depend on enriched data, explicitly design what happens when that data isn't available. The 'missing sourceItems' case should have been resolved during planning, not during implementation review."

## METRICS

| Metric | Value |
|--------|-------|
| Packages Modified | 4 |
| Files Modified | 10 |
| New Tests | 16 |
| Time Spent | ~3.5 hours |

---

**This feature enables the `--if-gitignore-conflict` flag to work correctly by providing accurate source tracking.**
