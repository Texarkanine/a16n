# Phase 2 implementation planning
_Exported on 1/24/2026 at 12:08:19 CST from Cursor (2.4.21)_

---

**User**

/niko/plan phase 2 of implementation; see @planning for design docs (read them all) and @memory-bank/archive for what's been done so far. USE THE MEMORY BANK!

---

**Cursor**

I'll read the planning docs, memory bank, and archive to create a comprehensive implementation plan for Phase 2.

Let me also review the existing codebase to understand what's been implemented and what needs extending for Phase 2.

Let me also check existing test fixtures to understand the expected behavior better.

Now I have a complete picture. Let me update the memory bank with a comprehensive Phase 2 implementation plan.

## Phase 2 Implementation Plan Complete

I've analyzed all planning documents and the Phase 1 archive to create a comprehensive implementation plan for Phase 2. Here's the summary:

### Phase 2 Scope: AgentSkill + FileRule

**Two new customization types to implement:**

| Type | Trigger | Cursor Format | Claude Format |
|------|---------|---------------|---------------|
| **AgentSkill** | Description matching | `.mdc` with `description:` | CLAUDE.md section (approximated) |
| **FileRule** | File glob patterns | `.mdc` with `globs:` | CLAUDE.md section (approximated) |

### Key Implementation Tasks

**Phase 2A: Cursor Plugin (Priority)**
1. **Discovery Classification** - Update `classifyRule()` with priority: globs → FileRule, description → AgentSkill, alwaysApply → GlobalPrompt
2. **MDC Validation** - Detect invalid YAML array globs format, warn user
3. **Emission** - Generate `.mdc` files with correct frontmatter for each type
4. **Test Fixtures** - New fixtures for skills and file rules

**Phase 2B: Claude Plugin**
1. **Research** - Document `.claude/skills/` format (minimal scope)
2. **Emission** - Approximate AgentSkill/FileRule as CLAUDE.md sections with descriptive headers and warnings

**Phase 2C: Integration**
- Update plugin `supports[]` arrays
- End-to-end integration tests
- CLI output for new types

### Critical Technical Decisions

1. **Globs Format**: Cursor uses comma-separated strings (`**/*.ts,**/*.tsx`), NOT YAML arrays
2. **Classification Priority**: `globs` takes precedence over `description`
3. **Claude Approximation**: FileRules emit to CLAUDE.md with warnings (no direct equivalent)

### 10 Acceptance Criteria Defined

Covering discovery, emission, and conversion for both new types, plus edge cases like invalid globs and mixed-type conversions.

### Memory Bank Updated

- `memory-bank/tasks.md` - Full implementation plan with 13 tasks
- `memory-bank/activeContext.md` - Current focus and technical notes
- `memory-bank/progress.md` - Progress tracking

### Recommended Next Step

Run `/niko/build` to begin implementation, starting with Task 2A.1 (Cursor Discovery Classification).

---

**User**

/niko/plan Claude code skills doc: @Claude Code : Skills ; these are cursor's "agent-requested" rules, with descriptions. Pay close attention to the frontmatter reference; this is how you'll translate activation correctly b/w them and @Cursor : Rules .

Claude code hooks: @Claude Code : Hooks is the challenging one that requires precision.  You probably will map a cursor glob rule to a Claude hook(s) that run on either PreToolUse or PostToolUse for the Read *and* Write tool. There are examples in https://code.claude.com/docs/en/hooks#hook-input  of what you'll get on that hook. https://code.claude.com/docs/en/hooks#pretooluse-decision-control  is good reference, maybe you'll need PreToolUse hook for Write (so rules are considered before asking to make file changes) and PostToolUse for read (so stuff's mixed in once the file content has been read and is being considered). additionalContext on hook output is probably where you'll inject the prompt that was in the Cursor rule body. This needs flowcharts in the plan and very, VERY good filesystem-based unit tests following the pattern we already had.

You absolutely need to fully research and plan the specific mapping techniques before beginning any execution or implementation. If this won't work, you MUST stop and tell me. If it will, definitely call my attention to the specific plan section / flowchart / diagram that indicates exactly how.

---

**Cursor**

This is a critical research phase. Let me fetch the Claude Code documentation for Skills and analyze the hook mechanism in detail to determine if this mapping is feasible.

Excellent research. Now I have a clear picture. Let me analyze the feasibility and create a detailed technical plan with flowcharts.

## Critical Analysis: Feasibility Assessment

### Claude Code Skills (AgentSkill mapping) - FEASIBLE ✅

From the [Claude Code Skills documentation](https://code.claude.com/docs/en/skills):

**Cursor AgentSkill** maps cleanly to **Claude Skill**:
- Cursor `description:` → Claude `description:` frontmatter
- Both use description for semantic matching/activation
- Claude skills live in `.claude/skills/<name>/SKILL.md`

### Claude Code Hooks (FileRule mapping) - FEASIBLE ✅ but COMPLEX

From the [Claude Code Hooks documentation](https://code.claude.com/docs/en/hooks):

**Key insight**: `additionalContext` in hook output is EXACTLY what we need. It injects text into Claude's context.

**Hook input** provides `tool_input.file_path` for both Read and Write tools, allowing glob matching.

**However**: This requires generating executable scripts + settings.json configuration, not just markdown files.

---

Let me update the implementation plan with detailed architecture and flowcharts.

## Phase 2 Planning Complete - Critical Findings

I've thoroughly researched the Claude Code documentation and confirmed this mapping **WILL WORK**. Here's the summary:

### Feasibility Confirmation

| Mapping | Status | Approach |
|---------|--------|----------|
| **AgentSkill: Cursor ↔ Claude** | ✅ FEASIBLE | Direct frontmatter mapping via `.claude/skills/` |
| **FileRule: Cursor → Claude** | ✅ FEASIBLE | Generated Python hook script + settings.local.json |
| **FileRule: Claude → Cursor** | ⚠️ LIMITED | Cannot reverse-engineer arbitrary hooks |

### The Key Technical Solution for FileRules

The critical insight from [Claude Code Hooks documentation](https://code.claude.com/docs/en/hooks):

1. **`additionalContext`** in hook output injects text into Claude's context - this is exactly what we need
2. **`tool_input.file_path`** is available in both PreToolUse and PostToolUse hooks
3. **Hook configuration** goes in `.claude/settings.local.json`

### Where to Find the Detailed Plan

**See `memory-bank/tasks.md` for:**

1. **Type Mapping Overview** - ASCII diagram showing complete Cursor ↔ Claude mapping
2. **AgentSkill Flow Diagrams** - Input/output format for both directions
3. **FileRule Hook Execution Flow** - Detailed flowchart showing:
   - PreToolUse for Write (inject rules BEFORE writing)
   - PostToolUse for Read (inject rules AFTER reading)
4. **Generated Hook Script Structure** - Complete Python implementation
5. **Generated settings.local.json** - Hook configuration format

### The Core FileRule → Hooks Architecture

```
Cursor FileRule              Generated Artifacts
─────────────────            ────────────────────
.cursor/rules/ts.mdc    →    .claude/hooks/file-rules.py (embeds all rules)
globs: **/*.ts               .claude/settings.local.json (hook config)
```

The Python script:
- Receives `file_path` from hook input
- Matches against embedded glob patterns  
- Returns `additionalContext` with matching rules' content

### Hook Timing Decision

- **PreToolUse for Write/Edit**: Claude sees rules BEFORE writing (knows conventions)
- **PostToolUse for Read**: Claude sees rules AFTER reading (context for what it just saw)

### Ready for Build

The plan is comprehensive and the mapping is confirmed feasible. Run `/niko/build` to begin implementation.

---

**User**

Does prompt injection via hooks in Claude Code actually require executable scripts? https://code.claude.com/docs/en/hooks#hooks-in-skills-and-agents  says you can put hooks in skills, what if we  treat Skills as the platform for both FileRule and Skills?

---

**Cursor**

Excellent catch! Let me re-read that section carefully.

You're absolutely right to question this. Looking at the documentation again:

**Hooks in skills still require `type: command`** - they still execute shell scripts. There's no declarative way to inject context via hooks without a script.

**BUT** - your insight is brilliant: We can use **Skills themselves** as the platform for FileRules!

## Revised Architecture: Skills-Based Approach

A Claude Skill has:
1. **`description`** - Controls when Claude loads it (semantic matching)
2. **Content** - Gets injected into context when loaded

### FileRule → Skill Mapping (Simpler!)

```yaml
# .claude/skills/typescript-rules/SKILL.md
---
name: typescript-rules
description: "TypeScript and TSX file conventions. Apply when reading, writing, or editing files matching *.ts or *.tsx patterns."
---

Use TypeScript strict mode.
Prefer interfaces over types.
Use explicit return types.
```

Claude will semantically decide to load this skill when working with TypeScript files.

### Comparison

| Approach | Matching | Scripts Needed | Complexity |
|----------|----------|----------------|------------|
| **Hook-based** | Deterministic (exact glob) | Yes (Python) | High |
| **Skill-based** | Semantic (description) | No | Low |

### The Tradeoff

- **Cursor FileRule**: Deterministic - rule is ALWAYS applied when file matches glob
- **Claude Skill**: Semantic - Claude DECIDES based on description relevance

But in practice, if the description says "Apply when working with *.ts files", Claude will reliably load it.

### Updated Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 REVISED: FileRule → Claude Skill (Simpler)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Cursor FileRule                    Claude Skill                            │
│  ───────────────                    ────────────                            │
│                                                                             │
│  .cursor/rules/ts.mdc               .claude/skills/ts-rules/SKILL.md        │
│  ---                                ---                                     │
│  globs: **/*.ts,**/*.tsx            name: ts-rules                          │
│  ---                        →       description: "TypeScript conventions.   │
│  Use strict mode...                  Apply for *.ts, *.tsx files."          │
│                                     ---                                     │
│                                     Use strict mode...                      │
│                                                                             │
│  WARNING: "Converted to skill with semantic matching.                       │
│            Original globs: **/*.ts,**/*.tsx"                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### This Means:

1. **No Python scripts needed**
2. **No settings.json hook configuration**
3. **Just generate SKILL.md files with descriptions mentioning the patterns**
4. **Emit a warning about semantic vs deterministic matching**

Should I update the implementation plan to use this simpler approach? We could offer both:
- **Default**: Skill-based (simpler, no scripts)
- **Optional `--strict-globs`**: Hook-based (deterministic, requires scripts)

---

**User**

I'm also looking at

```
Hooks can also provide context to Claude using additionalContext:

    "hookSpecificOutput.additionalContext" adds a string to Claude’s context before the tool executes.

{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "My reason here",
    "updatedInput": {
      "field_to_modify": "new value"
    },
    "additionalContext": "Current environment: production. Proceed with caution."
  }
}

```

seems to suggest we can have a hook that provides context (albeit, unreadable and inlined, it'll likely be gross shoving awhole cursor mdc file's content into additionalcontext, json-escaped...) in just the hook json. 

---

**Cursor**

You're right that `additionalContext` can be in the JSON output. But the question is: can we output that JSON **without** an external script?

Let me trace through the options:

## Option 1: Inline Echo Command

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "bash -c 'fp=$(jq -r .tool_input.file_path); [[ \"$fp\" == *.ts ]] && echo \"{\\\"hookSpecificOutput\\\":{\\\"additionalContext\\\":\\\"Use strict mode\\\"}}\"'"
      }]
    }]
  }
}
```

**Problems:**
1. `**/*.ts` glob doesn't translate to bash's `*.ts` pattern matching
2. JSON escaping inside JSON escaping inside bash is a nightmare
3. Multiline content is nearly impossible to inline
4. The `matcher` matches TOOL names (Write, Read), not file patterns

## Option 2: Skills (Recommended)

No hooks needed. Just semantic matching via description:

```yaml
# .claude/skills/typescript-rules/SKILL.md
---
name: typescript-rules  
description: "TypeScript conventions. Use when working with *.ts or *.tsx files."
---

Use TypeScript strict mode.
Prefer interfaces over types.
```

**Pros:** Simple, readable, no scripts, no escaping hell
**Cons:** Semantic matching instead of deterministic glob matching

## Option 3: Generated Python Script (Deterministic)

If users truly need deterministic matching, generate a script. But I think this is overkill for most use cases.

---

## My Recommendation: Skills-First Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REVISED PHASE 2 ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Cursor Type          a16n Model         Claude Output                      │
│  ───────────          ──────────         ────────────                       │
│                                                                             │
│  alwaysApply: true    GlobalPrompt   →   CLAUDE.md (Phase 1 ✅)             │
│                                                                             │
│  description:         AgentSkill     →   .claude/skills/X/SKILL.md          │
│  (no globs)                              (description in frontmatter)       │
│                                                                             │
│  globs: **/*.ts       FileRule       →   .claude/skills/X/SKILL.md          │
│                                          (description mentions patterns)    │
│                                          + WARNING about semantic matching  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Both AgentSkill AND FileRule → Claude Skills
(Different frontmatter descriptions, same output format)
```

This means:
1. **No scripts** to generate
2. **No settings.json hooks** to configure  
3. **Just SKILL.md files** with descriptions
4. **Clear warning** about semantic vs deterministic matching

The warning would be:
```
⚠ FileRule converted to Claude Skill with semantic matching.
  Original globs: **/*.ts, **/*.tsx
  Claude will apply this skill when working with TypeScript files based on context,
  rather than deterministic glob matching.
```

Should I update the plan with this simpler architecture? It dramatically reduces implementation complexity while still providing the core value (portability of file-specific rules).

---

**User**

We DO require correct globbing for FileRule in Claude code; no agent judgement shortcuts; we want actual deterministic globbing. a16n will do the heavy lifting in its complex implementation if needed; that's literally its job.

I see. globbing isn't included in the hook mechanism; our hook will have to glob and return (exit) 0 to cause the AdditionalContext to be provided to Claude Code.

THAT is a challenge. Is there a good universal npm cross-platform globbing library that we could `npx` as our hook, so our hook command is

`npx the-library ourglob1 ourglob2 --path the-path-from-hook` and get a nonzero exit code if there's a match? Obviously, the interface could differ. 

If there is no such thing, is that a good approach at all? If so, you know, as long as we're building npm libraries, WE could build that npm library...

---

**Cursor**

This is a great insight. Let me research existing CLI glob tools, then propose our solution.

Existing npm packages with glob matching are **libraries**, not CLIs:
- `minimatch` - library only
- `micromatch` - library only  
- `glob` / `globby` - library only, or CLI for *listing* files, not matching paths

There's no good "match this path against these globs" CLI that returns an exit code.

**This is exactly the kind of tool a16n should provide.**

## Proposed: `@a16n/glob-hook` Package

```
packages/
  glob-hook/                    # NEW PACKAGE
    src/
      index.ts                  # CLI entry point
      matcher.ts                # Glob matching using micromatch
    package.json
    README.md
```

### CLI Interface

```bash
# Read hook JSON from stdin, check file_path against globs
# Output additionalContext JSON if match, empty object if not
# Always exit 0 (non-zero = hook failure in Claude)

echo '{"tool_input":{"file_path":"src/components/Button.tsx"}}' | \
  npx @a16n/glob-hook \
    --globs "**/*.tsx,**/*.ts" \
    --context "Use React best practices. Prefer functional components."
```

**Match output:**
```json
{"hookSpecificOutput":{"additionalContext":"Use React best practices. Prefer functional components."}}
```

**No match output:**
```json
{}
```

### Generated Hook Configuration

When converting Cursor FileRules to Claude, we generate `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "npx @a16n/glob-hook --globs \"**/*.ts,**/*.tsx\" --context-file \".claude/rules/typescript.txt\""
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Read",
        "hooks": [{
          "type": "command",
          "command": "npx @a16n/glob-hook --globs \"**/*.ts,**/*.tsx\" --context-file \".claude/rules/typescript.txt\""
        }]
      }
    ]
  }
}
```

Note: `--context-file` reads content from a file (avoids JSON escaping hell).

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FILERULE: CURSOR → CLAUDE (DETERMINISTIC)                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  INPUT: Cursor .mdc file                                                        │
│  ┌─────────────────────────────────────┐                                        │
│  │ ---                                 │                                        │
│  │ globs: **/*.ts, **/*.tsx            │                                        │
│  │ ---                                 │                                        │
│  │ Use TypeScript strict mode.         │                                        │
│  │ Prefer interfaces over types.       │                                        │
│  └─────────────────────────────────────┘                                        │
│                    │                                                            │
│                    ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         a16n emit (Claude plugin)                       │    │
│  │                                                                         │    │
│  │  1. Write rule content to .claude/rules/<name>.txt                      │    │
│  │  2. Add hook entry to .claude/settings.local.json                       │    │
│  │     - PreToolUse (Write|Edit) + PostToolUse (Read)                      │    │
│  │     - command: npx @a16n/glob-hook --globs "..." --context-file "..."   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                    │                                                            │
│                    ▼                                                            │
│  OUTPUT: Two files generated                                                    │
│  ┌─────────────────────────────────────┐  ┌────────────────────────────────┐    │
│  │ .claude/rules/typescript.txt        │  │ .claude/settings.local.json    │    │
│  │                                     │  │                                │    │
│  │ Use TypeScript strict mode.         │  │ { "hooks": { "PreToolUse":...  │    │
│  │ Prefer interfaces over types.       │  │ }}                             │    │
│  └─────────────────────────────────────┘  └────────────────────────────────┘    │
│                                                                                 │
│  AT RUNTIME (Claude Code):                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Claude: "Write to src/utils/helper.ts"                                 │    │
│  │                          │                                              │    │
│  │                          ▼                                              │    │
│  │  Hook triggered: npx @a16n/glob-hook ...                                │    │
│  │                          │                                              │    │
│  │            ┌─────────────┴─────────────┐                                │    │
│  │            ▼                           ▼                                │    │
│  │    Path matches glob?           Path doesn't match?                     │    │
│  │            │                           │                                │    │
│  │            ▼                           ▼                                │    │
│  │    Output: {"hookSpecificOutput":      Output: {}                       │    │
│  │      {"additionalContext":             (no context injected)            │    │
│  │        "<rule content>"}}                                               │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Implementation Details for `@a16n/glob-hook`

```typescript
// packages/glob-hook/src/index.ts
import { program } from 'commander';
import micromatch from 'micromatch';
import { readFileSync } from 'fs';

interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    command?: string;
  };
}

program
  .requiredOption('--globs <patterns>', 'Comma-separated glob patterns')
  .option('--context <text>', 'Context to inject if match')
  .option('--context-file <path>', 'Read context from file')
  .parse();

const opts = program.opts();

// Read hook input from stdin
const stdin = readFileSync(0, 'utf-8');
const input: HookInput = JSON.parse(stdin);

// Extract file path from tool input
const filePath = input.tool_input?.file_path;

if (!filePath) {
  // No file path in input, output empty
  console.log('{}');
  process.exit(0);
}

// Check glob match
const patterns = opts.globs.split(',').map((p: string) => p.trim());
const isMatch = micromatch.isMatch(filePath, patterns);

if (isMatch) {
  const context = opts.contextFile 
    ? readFileSync(opts.contextFile, 'utf-8')
    : opts.context;
  
  console.log(JSON.stringify({
    hookSpecificOutput: {
      additionalContext: context
    }
  }));
} else {
  console.log('{}');
}

process.exit(0);
```

---

## Questions Before I Update the Plan

1. **Package name**: `@a16n/glob-hook` or something more generic like `glob-hook` (since it could be useful beyond a16n)?

2. **Scope**: Should this be part of the a16n monorepo or a separate standalone package?

3. **Dependencies for users**: This means Claude users need `npx` available. Should we document this requirement, or also support a fallback (like shipping a compiled binary)?

Want me to update `memory-bank/tasks.md` with this revised architecture including the `glob-hook` package?

