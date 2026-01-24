# TASK ARCHIVE: @a16n/glob-hook Package

## METADATA

| Field | Value |
|-------|-------|
| Task ID | GLOB-HOOK-BUILD |
| Date | 2026-01-24 |
| Complexity | Level 3 (Intermediate) |
| Phase | Phase 2 - Glob Hook Package |
| PR | https://github.com/Texarkanine/a16n/pull/2 |

---

## SUMMARY

Built `@a16n/glob-hook`, a CLI tool for deterministic glob-based file path matching in Claude Code hooks. This package is the critical enabler for Phase 2 FileRule support, bridging the gap between Cursor's glob patterns and Claude's hook system.

**Key Deliverables:**
- 4 source modules (types.ts, matcher.ts, io.ts, index.ts)
- 37 passing tests (14 matcher, 11 io, 12 CLI integration)
- Comprehensive README documentation
- Full monorepo integration

---

## REQUIREMENTS

### Problem Statement

Claude Code hooks use a `matcher` field that matches **tool names** (Read, Write), not file paths. To apply rules to specific file patterns (like `**/*.tsx` for React files), external tooling is needed.

### Solution

A CLI tool that:
1. Reads hook JSON from stdin (`{"tool_input":{"file_path":"src/Button.tsx"}}`)
2. Matches file path against glob patterns using micromatch
3. Outputs `additionalContext` JSON if matched, empty `{}` otherwise
4. Always exits 0 to prevent hook failures

### Acceptance Criteria (All Passed)

| AC | Description | Status |
|----|-------------|--------|
| AC1 | Basic glob matching | ✅ |
| AC2 | No match outputs `{}` | ✅ |
| AC3 | Multiple patterns (comma-separated) | ✅ |
| AC4 | Multiline context preserved | ✅ |
| AC5 | Missing file_path handled | ✅ |
| AC6 | Invalid JSON handled gracefully | ✅ |
| AC7 | Missing args handled gracefully | ✅ |

---

## IMPLEMENTATION

### Package Structure

```
packages/glob-hook/
├── src/
│   ├── index.ts      # CLI entry point with shebang
│   ├── types.ts      # HookInput, HookOutput, CliOptions interfaces
│   ├── matcher.ts    # micromatch wrapper with dot:true option
│   └── io.ts         # stdin parsing, stdout JSON output
├── test/
│   ├── matcher.test.ts  # 14 unit tests
│   ├── io.test.ts       # 11 unit tests
│   └── cli.test.ts      # 12 E2E integration tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Key Technical Decisions

1. **Single runtime dependency**: Only micromatch (battle-tested glob library)
2. **No CLI framework**: Raw `process.argv` for fastest startup latency
3. **Always exit 0**: Non-zero exit = hook failure in Claude
4. **Context via file**: `--context-file` reads from file to avoid JSON escaping
5. **Errors to stderr**: stdout reserved for JSON output

### Usage

```bash
echo '{"tool_input":{"file_path":"src/Button.tsx"}}' | \
  npx @a16n/glob-hook \
    --globs "**/*.tsx" \
    --context-file ".a16n/rules/react.txt"
```

---

## TESTING

### Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| matcher.ts | 14 | Glob patterns, dotfiles, directories, edge cases |
| io.ts | 11 | JSON parsing, output formatting, error handling |
| CLI (E2E) | 12 | All acceptance criteria + edge cases |
| **Total** | **37** | All passing |

### Testing Approach

- **TDD for libraries**: Wrote matcher and io tests before implementation
- **E2E for CLI**: Integration tests spawn actual CLI process with stdin/stdout
- **Test timeout**: 15s for CLI tests due to tsx startup time (~3s)

---

## LESSONS LEARNED

### Technical

1. **micromatch `matchBase` gotcha**: The option breaks directory patterns like `src/components/**`. Removed in favor of just `dot: true`.

2. **Node.js stdin in child processes**: Requires explicit `stdin.resume()` when spawned. Initial implementation caused test timeouts.

3. **No CLI framework needed**: Raw `process.argv` sufficient for 2 arguments. Avoided unnecessary dependencies.

4. **JSON output discipline**: Separating errors (stderr) from output (stdout) critical for pipe-based CLIs.

### Process

1. **Clear acceptance criteria accelerate testing**: AC1-AC7 mapped directly to test cases.

2. **TDD catches design issues early**: The `matchBase` bug was caught in red-green-refactor cycle.

3. **Monorepo patterns help**: Using `@a16n/models` as template made setup trivial.

### Future Improvements

- Consider `--debug` flag for verbose logging
- Pattern validation for common mistakes
- Performance metrics for hook latency debugging

---

## REFERENCES

| Document | Purpose |
|----------|---------|
| `planning/glob-hook/IMPLEMENTATION_PLAN.md` | Detailed task specifications |
| `planning/glob-hook/PRODUCT_BRIEF.md` | Why glob-hook exists |
| `planning/glob-hook/TECH_BRIEF.md` | Technical architecture |
| `memory-bank/reflection/reflection-GLOB-HOOK-BUILD.md` | Build reflection (archived) |

---

## NEXT STEPS

1. **Merge PR #2** after review
2. **Phase 2 continuation**: Implement FileRule emission in `@a16n/plugin-claude` using glob-hook
3. **Integration testing**: End-to-end Cursor → Claude conversion with FileRules
