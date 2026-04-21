---
sidebar_position: 1
title: CLI Overview
---

# CLI

The **a16n CLI**, `a16n`, provides command-line tools for converting AI agent configuration files between various agentic development toolchains.

## Installation

```bash
# Use directly with npx (no install needed)
npx a16n convert --from cursor --to claude .

# Or install globally
npm install -g a16n
```

## Examples

```bash
# Basic conversion: Cursor to Claude
a16n convert --from cursor --to claude .

# Preview what would happen
a16n convert --from cursor --to claude --dry-run .

# JSON output for scripting
a16n convert --from cursor --to claude --json . | jq '.written'

# Delete sources after migration
a16n convert --from cursor --to claude --delete-source .

# Keep outputs out of version control
a16n convert --from cursor --to claude --gitignore-output-with exclude .

# Mirror source git status to outputs
a16n convert --from cursor --to claude --gitignore-output-with match .

# Read from one directory, write to another
a16n convert --from cursor --to claude --from-dir ./project-a --to-dir ./project-b

# Rewrite path references during conversion
a16n convert --from cursor --to claude --rewrite-path-refs .
```

## Split Directories

By default, a16n reads and writes in the same directory (the positional `[path]` argument, which defaults to `.`). The `--from-dir` and `--to-dir` flags let you decouple input and output:

| Flag | Effect |
|------|--------|
| `--from-dir <dir>` | Read source customizations from this directory instead of `[path]` |
| `--to-dir <dir>` | Write converted output to this directory instead of `[path]` |

When both flags are used, the positional `[path]` argument is effectively ignored. Either flag can be used independently - the other defaults to `[path]`.

The `--from-dir` flag also works with `discover`:

```bash
a16n discover --from cursor --from-dir ./other-project
```

**Interaction with other flags:**
- `--delete-source` deletes from the source directory (i.e., `--from-dir` if set)
- `--gitignore-output-with` operates against the target directory (i.e., `--to-dir` if set)

## Path Reference Rewriting

When your source files reference other source files by path (e.g., a Cursor rule that says `Load: .cursor/rules/auth.mdc`), those references may be stale after conversion if the target format uses different paths.

The `--rewrite-path-refs` flag automatically updates these path references during conversion:

```bash
a16n convert --from cursor --to claude --rewrite-path-refs .
```

**How it works:**

1. a16n discovers source items and performs a dry-run emit to learn the target paths
2. It builds a mapping of source paths → target paths (e.g., `.cursor/rules/auth.mdc` → `.claude/rules/auth.md`)
3. It rewrites content using exact string replacement (longest match first, to prevent partial match corruption)
4. It emits the rewritten items to disk

**What gets rewritten:**

For every customization a16n discovers - rules, commands, settings, simple skills, `.cursorignore`/`.claude/settings.json`, etc. - the output content gets rewritten.

There is one intentional exception: [AgentSkillIO](/models#agentskillio) skills with at least 1 or more additional files beyond `SKILL.md`, herein referred to as "Complex Skills". An AgentSkillIO's `SKILL.md` body is always rewritten, but not all of its additional files are.

| Path inside Skill | Rewritten |
|---|---|
| `SKILL.md` | ✅ |
| `scripts/**` | ✅ |
| `references/**` | ✅ |
| `assets/**` | ❌ |
| Any other path | ❌ |

The [AgentSkills.io spec](https://agentskills.io/specification#optional-directories) only specifies three subdirectories: `scripts/`, `references/`, and `assets/`. However, your harness+LLM will probably work just fine if there are other files in the skill directory. `a16n` will dutifully copy any such extra paths, as well.

Why rewrite only those two subtrees? Because `scripts` and `references` are defined by the AgentSkills.io spec as places that should contain text, where rewritable paths may be found. `assets` is defined as a place that may contain templates, images, data files, suggesting non-textual, binary content.

Any *other* file paths are outside the AgentSkills.io spec and `a16n` has no guidance as to what sort of content they may contain. Rather than building an exhaustive list of all possible file extensions and file headers to try to figure out "is this content logically text," we just skip rewriting them.

**Orphan warnings:**

If a file references a source-format path that isn't in the conversion set (e.g., `.cursor/rules/missing.mdc` where `missing.mdc` doesn't exist), a16n emits an `orphan-path-ref` warning so you can fix it manually.

Orphan-reference scanning is scoped to only candidates for rewriting, so un-rewritten paths inside `assets/` or unknown subtrees never produce spurious orphan warnings.

## Output Format

### Standard Output

```
Discovered: 5 items
Wrote: CLAUDE.md
Wrote: .claude/settings.json
⚠ Warning [approximated]: FileRule → Hook conversion is approximate
Converted 5 items → 2 files (1 warning)
```

### JSON Output

With `--json`, outputs structured data:

```json
{
  "discovered": [
    {
      "id": "global-prompt::.cursor/rules/core.mdc",
      "type": "global-prompt",
      "sourcePath": ".cursor/rules/core.mdc",
      "content": "..."
    }
  ],
  "written": [
    {
      "path": "/project/CLAUDE.md",
      "type": "global-prompt",
      "itemCount": 3,
      "isNewFile": true
    }
  ],
  "warnings": [],
  "unsupported": []
}
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (invalid options, missing directory, conversion failure) |

---

## See Also

- [CLI Reference](/cli/reference) - Generated command reference
- [Understanding Conversions](/understanding-conversions) - How conversions work
- [Engine](/engine) - Programmatic API
- [Plugin: Cursor](/plugin-cursor) - Cursor format details
- [Plugin: Claude](/plugin-claude) - Claude format details
