# Memory Bank: Tasks

## Current Task

**Task ID**: GLOB-HOOK-BUILD
**Phase**: 2 - Glob Hook Package
**Complexity**: Level 3 (Intermediate - clear architecture, moderate testing)
**Status**: Planning Complete → Ready for Build

---

## Task Overview

Build the `@a16n/glob-hook` package - a CLI tool for deterministic glob matching in Claude Code hooks. This package enables FileRule support in Phase 2 by providing cross-platform glob matching that integrates with Claude's hook system.

### Why This Package Exists

| Claude Hook Limitation | Solution |
|------------------------|----------|
| `matcher` field matches **tool names** (Read, Write), not file paths | glob-hook matches file paths |
| No built-in glob matching for `tool_input.file_path` | glob-hook uses micromatch |
| Existing npm glob packages are libraries, not CLIs | glob-hook is a CLI |
| Need to output `additionalContext` JSON on match | glob-hook handles I/O |

### CLI Interface

```bash
# Read hook JSON from stdin, match file_path against globs
echo '{"tool_input":{"file_path":"src/Button.tsx"}}' | \
  npx @a16n/glob-hook \
    --globs "**/*.tsx,**/*.ts" \
    --context-file ".a16n/rules/typescript.txt"
```

**Match output:**
```json
{"hookSpecificOutput":{"additionalContext":"<file contents>"}}
```

**No match output:**
```json
{}
```

---

## Implementation Tasks

### Task 1: Package Setup
**Status**: ✅ Complete  
**Estimated**: 30 min

**Deliverable**: Package skeleton in monorepo at `packages/glob-hook/`

**Files to create**:
```
packages/glob-hook/
├── src/
│   └── index.ts      # Stub
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

**package.json** key fields:
- `name`: `@a16n/glob-hook`
- `bin`: `{ "glob-hook": "dist/index.js" }`
- `dependencies`: `micromatch` only
- `devDependencies`: `@types/micromatch`, `@types/node`, `typescript`, `vitest`, `tsx`

**Verification**:
```bash
pnpm install
pnpm --filter @a16n/glob-hook build
```

---

### Task 2: Types Module
**Status**: ✅ Complete  
**Estimated**: 15 min

**Deliverable**: TypeScript interfaces for hook I/O

**File**: `src/types.ts`

```typescript
/**
 * Input received from Claude Code hook system via stdin.
 */
export interface HookInput {
  hook_event_name?: 'PreToolUse' | 'PostToolUse';
  tool_name: string;
  tool_input: {
    file_path?: string;
    content?: string;
    command?: string;
  };
  tool_response?: {
    content?: string;
  };
}

/**
 * Output to Claude Code hook system via stdout.
 */
export interface HookOutput {
  hookSpecificOutput?: {
    hookEventName?: string;
    additionalContext?: string;
  };
}

/**
 * Parsed CLI options.
 */
export interface CliOptions {
  globs: string;       // Required: comma-separated glob patterns
  contextFile: string; // Required: path to context file
}
```

**Verification**: TypeScript compiles without errors.

---

### Task 3: Matcher Module
**Status**: ✅ Complete  
**Estimated**: 1 hour (including tests)

**Deliverable**: Glob matching logic with comprehensive tests

**File**: `src/matcher.ts`

```typescript
import micromatch from 'micromatch';

/**
 * Check if a file path matches any of the provided glob patterns.
 */
export function matchesAny(filePath: string, patterns: string[]): boolean {
  return micromatch.isMatch(filePath, patterns, {
    dot: true,        // Match dotfiles
    matchBase: true,  // Allow basename matching
  });
}
```

**Test file**: `test/matcher.test.ts`

**Test cases**:
| Test Case | Input Path | Patterns | Expected |
|-----------|------------|----------|----------|
| Simple extension | `src/Button.tsx` | `["**/*.tsx"]` | `true` |
| No match | `src/Button.ts` | `["**/*.tsx"]` | `false` |
| Multiple patterns | `src/index.ts` | `["**/*.ts", "**/*.tsx"]` | `true` |
| Nested path | `src/deep/file.ts` | `["**/*.ts"]` | `true` |
| Dotfile | `.eslintrc.js` | `["**/*.js"]` | `true` |
| Directory pattern | `src/components/X.tsx` | `["src/components/**"]` | `true` |
| Directory no match | `src/utils/X.ts` | `["src/components/**"]` | `false` |
| Basename matching | `Button.tsx` | `["*.tsx"]` | `true` |

**Verification**:
```bash
pnpm --filter @a16n/glob-hook test
```

---

### Task 4: I/O Module
**Status**: ✅ Complete  
**Estimated**: 30 min

**Deliverable**: Stdin reading and stdout writing

**File**: `src/io.ts`

```typescript
import { HookInput, HookOutput } from './types';

export async function readStdin(): Promise<HookInput> {
  return new Promise((resolve, reject) => {
    let data = '';
    
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error(`Invalid JSON: ${e}`));
      }
    });
    process.stdin.on('error', reject);
    
    // Timeout fallback
    setTimeout(() => reject(new Error('Stdin timeout')), 5000);
  });
}

export function writeOutput(output: HookOutput): void {
  console.log(JSON.stringify(output));
}
```

**Test file**: `test/io.test.ts`

Test cases:
- Valid JSON parsing
- Invalid JSON handling
- Empty input handling

---

### Task 5: CLI Entry Point
**Status**: ✅ Complete  
**Estimated**: 1 hour

**Deliverable**: Main CLI with minimal arg parsing

**File**: `src/index.ts`

Key requirements:
1. Shebang: `#!/usr/bin/env node`
2. Minimal arg parsing via raw `process.argv` (no dependencies)
3. Read stdin → parse JSON → extract file_path
4. Match against patterns → read context file if match
5. Output JSON → exit 0 (always, even on errors)

**Error handling philosophy**:
- Never fail the hook (always exit 0)
- Errors go to stderr, not stdout
- If we can't match, output `{}`

---

### Task 6: CLI Integration Tests
**Status**: ✅ Complete  
**Estimated**: 1 hour

**Deliverable**: End-to-end CLI tests

**File**: `test/cli.test.ts`

**Test structure**:
```typescript
function runCli(args: string[], stdin: object): Promise<{
  stdout: string;
  stderr: string;
  code: number;
}>
```

**Test cases**:
| Test | Description | Expected |
|------|-------------|----------|
| AC1 | Pattern matches, outputs context | `additionalContext` present |
| AC2 | Pattern doesn't match | `{}` output |
| AC3 | Multiple patterns, one matches | `additionalContext` present |
| AC4 | Multiline context file | Full content preserved |
| AC5 | Missing file_path in input | `{}` output |
| AC6 | Invalid JSON input | `{}` output, error to stderr |
| AC7 | Missing required args | `{}` output, error to stderr |

---

### Task 7: Documentation
**Status**: ✅ Complete  
**Estimated**: 30 min

**Deliverable**: Package README

**File**: `README.md`

Sections:
- Installation (via npx)
- Usage examples
- Options table
- Output format
- Integration with a16n
- Requirements (Node.js >= 18)

---

## Acceptance Criteria

### AC1: Basic Glob Matching
**Given** stdin: `{"tool_input":{"file_path":"src/Button.tsx"}}`
**And** context file `.a16n/rules/react.txt` containing `React rules`
**When** run with `--globs "**/*.tsx" --context-file ".a16n/rules/react.txt"`
**Then** output: `{"hookSpecificOutput":{"additionalContext":"React rules"}}`

### AC2: No Match
**Given** stdin: `{"tool_input":{"file_path":"src/utils.py"}}`
**When** run with `--globs "**/*.tsx" --context-file ".a16n/rules/react.txt"`
**Then** output: `{}`

### AC3: Multiple Patterns
**Given** stdin: `{"tool_input":{"file_path":"src/index.ts"}}`
**When** run with `--globs "**/*.ts,**/*.tsx" --context-file ".a16n/rules/ts.txt"`
**Then** output includes `additionalContext`

### AC4: Multiline Context
**Given** context file with multiple lines
**When** pattern matches
**Then** output `additionalContext` preserves all lines

### AC5: Missing file_path
**Given** stdin: `{"tool_name":"Bash","tool_input":{"command":"ls"}}`
**When** run with any globs
**Then** output: `{}`

### AC6: Invalid JSON Input
**Given** invalid JSON on stdin
**When** run
**Then** exit 0, output `{}`, log error to stderr

### AC7: npx Invocation
**When** run via `npx @a16n/glob-hook --globs "**/*.ts" --context-file "test.txt"`
**Then** executes successfully

---

## Task Dependencies

```
Task 1 (Setup)
    ↓
Task 2 (Types)
    ↓
    ├─→ Task 3 (Matcher) → ┐
    │                      │
    └─→ Task 4 (I/O)    → ─┤
                           ↓
                    Task 5 (CLI)
                           ↓
                    Task 6 (Integration Tests)
                           ↓
                    Task 7 (Documentation)
```

Tasks 3 and 4 can be done in parallel after Task 2.

---

## Definition of Done

glob-hook is complete when:
- [x] All 7 acceptance criteria pass
- [x] `pnpm --filter @a16n/glob-hook build` succeeds
- [x] `pnpm --filter @a16n/glob-hook test` passes (all tests green)
- [x] CLI works via `tsx` during development
- [x] README accurately describes usage
- [x] Package integrates with monorepo build

---

## Post-Implementation (Phase 2 Continuation)

After glob-hook is built:

1. **Update @a16n/plugin-claude**: Add FileRule emission that generates:
   - `.a16n/rules/<name>.txt` - Rule content files
   - `.claude/settings.local.json` - Hook configurations using glob-hook

2. **Integration testing**: Verify full Cursor FileRule → Claude conversion flow

3. **Publish**: Include in next a16n release

---

## Reference Documents

- `planning/glob-hook/PRODUCT_BRIEF.md` - Why we need glob-hook
- `planning/glob-hook/TECH_BRIEF.md` - Technical architecture
- `planning/glob-hook/IMPLEMENTATION_PLAN.md` - Detailed task specs
- `planning/how-to-xlate-cursor-globs-to-claude-hooks.md` - Full planning discussion
