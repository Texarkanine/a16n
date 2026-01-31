---
title: Understanding Conversions
description: How a16n converts agent customization between different AI coding tools
---

# Understanding Conversions

Different AI coding tools have different capabilities. a16n handles this transparently, converting what it can and warning you about limitations.

## What Translates Cleanly

These concepts map directly between tools:

| Concept | Cursor | Claude Code |
|---------|--------|-------------|
| Global prompts | `alwaysApply: true` rules | `CLAUDE.md` |
| File-specific rules | `globs: [...]` rules | Tool hooks |
| Context-triggered | `description: ...` rules | Skills |
| Ignore patterns | `.cursorignore` | `permissions.deny` Read rules |
| Skills | `.cursor/skills/*/SKILL.md` | `.claude/skills/*/SKILL.md` |
| Manual prompts | Skills with `disable-model-invocation: true` | Skills with `disable-model-invocation: true` |

## What Gets Approximated

Some features don't have perfect equivalents. a16n converts them as closely as possible and warns you:

| Feature | From | To | Behavior |
|---------|------|-----|----------|
| Multiple `alwaysApply` rules | Cursor | Claude | ⚠️ Merged into one file |
| Ignore patterns | Cursor | Claude | ≈ Converted to Read permission denials |
| Manual prompts | Cursor | Claude | ↔️ Bidirectional via `disable-model-invocation: true` |

## What Gets Skipped

Some features cannot be converted due to fundamental differences between tools:

| Feature | From | Reason |
|---------|------|--------|
| Complex commands | Cursor | Commands with `$ARGUMENTS`, `!`, `@`, or `allowed-tools` cannot be converted |
| Skills with hooks | Claude | Skills with `hooks:` frontmatter are not convertible to Cursor |

a16n always warns you when conversions are lossy or irreversible.

## Example Warning Output

When you run a conversion, a16n shows you exactly what happened:

```text
⚠ Merged 3 Cursor rules with alwaysApply:true into single CLAUDE.md
  Sources: general.mdc, style.mdc, testing.mdc
  Hint: Converting back will produce 1 file, not the original count

≈ AgentIgnore approximated as permissions.deny (behavior may differ slightly)
  Sources: .cursorignore
  Hint: Behavior may differ slightly between tools

✓ Wrote CLAUDE.md (3 sections, 127 lines)
✓ Wrote .claude/settings.json (4 deny rules)
Summary: 4 discovered, 2 written, 2 warnings
```

## Warning Codes

a16n uses specific warning codes to help you understand conversion issues:

| Code | Meaning |
|------|---------|
| `MERGED` | Multiple sources were combined into one output |
| `APPROXIMATED` | Feature was converted to nearest equivalent |
| `SKIPPED` | Feature could not be converted |
| `EMPTY_CONTENT` | Source file had no convertible content |

## Roundtrip Behavior

Converting back and forth is not always lossless:

```bash
# Original: 3 Cursor rules
a16n convert --from cursor --to claude

# Result: 1 CLAUDE.md file

# Convert back
a16n convert --from claude --to cursor

# Result: 1 Cursor rule (not 3)
```

This is expected behavior. a16n warns you when conversions reduce information.

## File Mappings

### Cursor → Claude

| Cursor Source | Claude Target |
|---------------|---------------|
| `.cursor/rules/*.mdc` (alwaysApply) | `CLAUDE.md` |
| `.cursor/rules/*.mdc` (globs) | `.claude/hooks.json` + `@a16njs/glob-hook` |
| `.cursorignore` | `.claude/settings.json` (permissions.deny) |
| `.cursor/skills/*/SKILL.md` | `.claude/skills/*/SKILL.md` |

### Claude → Cursor

| Claude Source | Cursor Target |
|---------------|---------------|
| `CLAUDE.md` | `.cursor/rules/claude.mdc` |
| `.claude/skills/*/SKILL.md` | `.cursor/skills/*/SKILL.md` |

## Learn More

- [CLI Reference](/cli/reference) - Full command documentation
- [FAQ](/faq) - Common questions about conversions
