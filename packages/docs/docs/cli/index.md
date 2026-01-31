---
sidebar_position: 1
---

# CLI

The **a16n CLI** provides command-line tools for converting AI agent configuration files between Cursor and Claude Code formats.

## Installation

```bash
# Use directly with npx (no install needed)
npx a16n convert --from cursor --to claude .

# Or install globally
npm install -g a16n
```

## Commands

### convert

Convert agent customizations between tools.

```bash
a16n convert --from <agent> --to <agent> [options] [path]
```

#### Required Options

| Option | Description |
|--------|-------------|
| `-f, --from <agent>` | Source agent (e.g., `cursor`, `claude`) |
| `-t, --to <agent>` | Target agent (e.g., `cursor`, `claude`) |

#### Optional Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | Show what would happen without writing files |
| `--json` | Output results as JSON (for scripting) |
| `-q, --quiet` | Suppress non-error output |
| `-v, --verbose` | Show detailed output |
| `--delete-source` | Delete source files after successful conversion |

#### Git Ignore Management

Control how converted output files are handled in git:

| Flag | Description |
|------|-------------|
| `--gitignore-output-with <style>` | Manage git-ignore status of output files |
| `--if-gitignore-conflict <resolution>` | How to resolve git-ignore conflicts in `match` mode |

**`--gitignore-output-with` values:**

| Value | Description |
|-------|-------------|
| `none` | Don't modify any git files (default) |
| `ignore` | Add outputs to `.gitignore` |
| `exclude` | Add outputs to `.git/info/exclude` (local, not shared) |
| `hook` | Add outputs to pre-commit hook (prevents accidental commits) |
| `match` | Mirror source file git status to outputs |

**`--if-gitignore-conflict` values (used with `match` mode):**

| Value | Description |
|-------|-------------|
| `skip` | Emit warning and skip conflicting files (default) |
| `ignore` | Add conflicting outputs to `.gitignore` |
| `exclude` | Add conflicting outputs to `.git/info/exclude` |
| `hook` | Add conflicting outputs to pre-commit hook |
| `commit` | Keep outputs tracked (remove from a16n-managed ignore sections) |

#### Examples

```bash
# Basic conversion: Cursor to Claude
a16n convert --from cursor --to claude .

# Basic conversion: Claude to Cursor
a16n convert --from claude --to cursor .

# Preview what would happen
a16n convert --from cursor --to claude --dry-run .

# JSON output for scripting
a16n convert --from cursor --to claude --json . | jq '.written'

# Delete sources after migration
a16n convert --from cursor --to claude --delete-source .

# Keep outputs out of version control
a16n convert --from cursor --to claude --gitignore-output-with ignore .

# Mirror source git status to outputs
a16n convert --from cursor --to claude --gitignore-output-with match .
```

---

### discover

List agent customizations without converting. Useful for understanding what's in a project before conversion.

```bash
a16n discover --from <agent> [options] [path]
```

#### Required Options

| Option | Description |
|--------|-------------|
| `-f, --from <agent>` | Agent format to discover (e.g., `cursor`, `claude`) |

#### Optional Flags

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON |
| `-v, --verbose` | Show detailed output |

#### Examples

```bash
# Discover Cursor customizations
a16n discover --from cursor .

# Discover Claude customizations
a16n discover --from claude .

# JSON output
a16n discover --from cursor --json . | jq '.items[] | .type'
```

---

### plugins

Show available plugins and their capabilities.

```bash
a16n plugins
```

#### Example Output

```
Available plugins:

  cursor
    Name: Cursor IDE
    Supports: global-prompt, agent-skill, file-rule, agent-ignore, manual-prompt

  claude
    Name: Claude Code
    Supports: global-prompt, agent-skill, file-rule, agent-ignore, manual-prompt
```

---

## Supported Agents

| Agent | Plugin | Status |
|-------|--------|--------|
| Cursor IDE | `@a16njs/plugin-cursor` | ✅ Bundled |
| Claude Code | `@a16njs/plugin-claude` | ✅ Bundled |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (invalid options, missing directory, conversion failure) |

---

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

---

## See Also

- [Understanding Conversions](/understanding-conversions) - How conversions work
- [Engine](/engine) - Programmatic API
- [Plugin: Cursor](/plugin-cursor) - Cursor format details
- [Plugin: Claude](/plugin-claude) - Claude format details
