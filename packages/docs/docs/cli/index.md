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
```

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
