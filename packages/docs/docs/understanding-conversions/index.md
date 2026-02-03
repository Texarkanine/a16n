---
title: Understanding Conversions
description: How a16n converts agent customization between different AI coding tools
---

# Understanding Conversions

Different AI coding tools have different capabilities. a16n handles this as transparently as possible, converting what it can and warning you about limitations.

## The Concepts

a16n understands the following kinds of agent customizations:

- **Global Prompts** - prompts that are always injected into the agent's context each time the agent is invoked, e.g.
    - CLAUDE.md
    - Cursor Rules with `alwaysApply: true`
- **File-specific rules** - prompts that are injected into the agent's context when working with specific files, e.g.
    - Cursor Rules with `globs: [...]`
- **Skills** - prompts that are injected into the agent's context when the agent decides they're needed, e.g.
    - Cursor Rules with `description: ...`
    - Claude Code skills
    - [AgentSkills.io](https://agentskills.io) skills
- **Manual prompts** - prompts that are injected into the agent's context when the user invokes them, e.g.
    - Cursor Commands
    - Cursor Rules with no `globs` or `description`, when `@mention`'d
    - AgentSkills with `disable-model-invocation: true`
- **Ignore patterns** - patterns that are ignored by the agent, e.g.
    - `.cursorignore`
    - Claude Code `permissions.deny` Read rules

See the [Models](/models) page for more details.

## What Translates Cleanly

Some concepts map cleanly between tools, including but not necessarily limited to:

| Concept               | Cursor                                       | Claude Code                                  |
|-----------------------|----------------------------------------------|----------------------------------------------|
| Global Prompts        | `alwaysApply: true` rules                    | `.claude/rules/*.md` (no `paths:`)           |
| File Rules            | `globs: [...]` rules                         | `.claude/rules/*.md` with `paths:` frontmatter |
| Skills                | `description: ...` rules                     | Skills                                       |
| AgentSkills.io Skills | `.cursor/skills/*/SKILL.md`                  | `.claude/skills/*/SKILL.md`                  |
| Manual Prompts        | Commands in `.cursor/commands/*.md`          | Skills with `disable-model-invocation: true` |
| Ignore patterns       | `.cursorignore`                              | `permissions.deny` Read rules                |


## What Gets Approximated

Some features don't have perfect equivalents. a16n converts them as closely as possible and warns you about such situations.

Some lossy conversions include, but are not necessarily limited to:

| Feature                     | From   | To     | Behavior                                      |
|-----------------------------|--------|--------|-----------------------------------------------|
| Ignore patterns             | Cursor | Claude | ≈ Converted to Read permission denials        |

## What Gets Skipped

Not all concepts exist across all toolchains. a16n warns you and skips impossible conversions.

Some impossible conversions include, but are not necessarily limited to:

| Feature                 | From   | To     | Reason                                                                      |
|-------------------------|--------|--------|-----------------------------------------------------------------------------|
| Complex Commands        | Cursor | Claude | Commands with `$ARGUMENTS`, `!`, `@`, or `allowed-tools` have no equivalent |
| Skills with hooks       | Claude | Cursor | Cursor skills do not support hooks                                          |

## Non-Invertible

a16n *translates* from one toolchain to another, and like all translations, running it back-and-forth, or through several iterations, does not always result in the original input.

For example, `CLAUDE.md` converts into a Cursor Rule with `alwaysApply: true`. But, converting a Cursor `alwaysApply: true` rule back into Claude will produce 
`.claude/rules/*.md` file, rather than appending or creating a `CLAUDE.md` file.

Since a16n doesn't know what conversions you may attempt after the first, it cannot warn you about such non-invertible (or multi-step) lossiness like this.

## Example Warning Output

When you run a conversion, a16n shows you exactly what happened:

```text
≈ AgentIgnore approximated as permissions.deny (behavior may differ slightly)
  Sources: .cursorignore
  Hint: Behavior may differ slightly between tools

✓ Wrote .claude/rules/general.md
✓ Wrote .claude/rules/style.md
✓ Wrote .claude/rules/testing.md
✓ Wrote .claude/settings.json (4 deny rules)
Summary: 4 discovered, 4 written, 1 warning
```

## Warning Codes

a16n emits warnings when conversions can't be perfect. These appear in CLI output (with icons) and in JSON output under the `warnings` array.

| Code | Icon | Meaning |
|------|------|---------|
| `merged` | ⚠ | Multiple sources were combined into one output |
| `approximated` | ≈ | Feature was converted to nearest equivalent |
| `skipped` | ⊘ | Feature could not be converted |
| `overwritten` | ↺ | Existing file was replaced |
| `file-renamed` | → | File was renamed to avoid collision |

**Note**: Warnings don't affect the exit code. The CLI exits 0 on success (even with warnings) and 1 on error.

### JSON Output Example

With `--json`, warnings appear in the output:

```json
{
  "warnings": [
    {
      "code": "approximated",
      "message": "AgentIgnore approximated as permissions.deny (behavior may differ slightly)"
    }
  ]
}
```

## Learn More

- [CLI Reference](/cli/reference) - Full command documentation
- [FAQ](/faq) - Common questions
