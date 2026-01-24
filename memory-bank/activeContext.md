# Memory Bank: Active Context

## Current Focus

**Task**: GLOB-HOOK-BUILD
**Status**: Planning Complete → Ready for Build
**Phase**: 2 - Glob Hook Package

## What We're Building

`@a16n/glob-hook` - A CLI tool that:
1. Reads Claude Code hook input from stdin (JSON with `tool_input.file_path`)
2. Matches file path against provided glob patterns using micromatch
3. Outputs JSON with `additionalContext` if matched, empty object if not

## Why This Matters

This package is the **critical blocker** for Phase 2 FileRule implementation. Without deterministic glob matching in Claude hooks, we cannot convert Cursor FileRules to Claude with full fidelity.

| Without glob-hook | With glob-hook |
|-------------------|----------------|
| FileRules → approximated as Skills | FileRules → deterministic hooks |
| Semantic matching (Claude decides) | Glob matching (always applies) |
| Loss of user intent | Preserves user intent |

## Technical Architecture

```
Claude Code Runtime
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  User action: Write to src/Button.tsx                          ┃
┃           ↓                                                    ┃
┃  PreToolUse hook fires                                         ┃
┃           ↓                                                    ┃
┃  npx @a16n/glob-hook --globs "**/*.tsx" --context-file "..."   ┃
┃           ↓                                                    ┃
┃  ┌─ stdin: {"tool_input":{"file_path":"src/Button.tsx"}}       ┃
┃  │                                                             ┃
┃  │  glob-hook processing:                                      ┃
┃  │  1. Parse stdin JSON                                        ┃
┃  │  2. Extract file_path                                       ┃
┃  │  3. micromatch.isMatch(file_path, patterns)                 ┃
┃  │  4. If match: read context file, output JSON                ┃
┃  │  5. If no match: output {}                                  ┃
┃  │                                                             ┃
┃  └─ stdout: {"hookSpecificOutput":{"additionalContext":"..."}} ┃
┃           ↓                                                    ┃
┃  Claude receives additionalContext (rules injected!)           ┃
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Implementation Tasks

| # | Task | Dependencies | Estimate |
|---|------|--------------|----------|
| 1 | Package Setup | - | 30 min |
| 2 | Types Module | Task 1 | 15 min |
| 3 | Matcher Module | Task 2 | 1 hour |
| 4 | I/O Module | Task 2 | 30 min |
| 5 | CLI Entry Point | Tasks 3, 4 | 1 hour |
| 6 | Integration Tests | Task 5 | 1 hour |
| 7 | Documentation | Task 6 | 30 min |

**Total estimate**: ~5 hours

## Key Technical Decisions

1. **Single runtime dependency**: Only micromatch (battle-tested glob library)
2. **No CLI framework**: Raw `process.argv` for fastest startup latency
3. **Always exit 0**: Non-zero exit = hook failure in Claude
4. **Context via file**: `--context-file` reads from file to avoid JSON escaping hell
5. **Errors to stderr**: stdout is reserved for JSON output

## Files to Create

```
packages/glob-hook/
├── src/
│   ├── index.ts      # CLI entry point (shebang)
│   ├── types.ts      # TypeScript interfaces
│   ├── matcher.ts    # Glob matching (micromatch wrapper)
│   └── io.ts         # Stdin/stdout handling
├── test/
│   ├── matcher.test.ts
│   ├── io.test.ts
│   └── cli.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Ready for Build

Run `/niko/build` to begin implementation starting with Task 1 (Package Setup).

## Reference

See `memory-bank/tasks.md` for full implementation plan with acceptance criteria.
