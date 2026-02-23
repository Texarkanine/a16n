---
title: Understanding Conversions
description: How a16n converts agent customization between different AI coding tools
---

# Understanding Conversions

Different AI coding tools model agent customization differently. a16n translates between them with one primary goal:

> **preserve behavior whenever possible**

This page explains why conversions sometimes change structure, produce warnings, or cannot be performed at all. The goal is to help you reason about what you see after running a conversion.

## The Concepts

a16n recognizes several common kinds of agent configuration.

* **Global Prompts** - always injected when the agent runs

  * `CLAUDE.md`
  * Cursor rules with `alwaysApply: true`

* **File Rules** - injected when working on matching files

  * Cursor rules with `globs: [...]`
  * Claude rules using `paths:`

* **Skills** - invoked when the model decides they are useful

  * Cursor rules with `description:`
  * Claude Code skills
  * AgentSkills.io skills

* **Manual Prompts** - invoked directly by the user

  * Cursor commands
  * Rules without `globs` or `description` when `@mention`ed
  * AgentSkills with `disable-model-invocation: true`

* **Ignore Patterns** - limit what the agent can read or modify

  * `.cursorignore`
  * Claude `permissions.deny` rules

See the [Models](/models) page for the full capability matrix.

## What Translates Cleanly

Some concepts have clear equivalents across tools.

| Concept               | Cursor                      | Claude Code                                  |
| --------------------- | --------------------------- | -------------------------------------------- |
| Global Prompts        | `alwaysApply: true` rules   | `.claude/rules/*.md` (no `paths:`)           |
| File Rules            | `globs: [...]` rules        | `.claude/rules/*.md` with `paths:`           |
| Skills                | `description:` rules        | Skills                                       |
| AgentSkills.io Skills | `.cursor/skills/*/SKILL.md` | `.claude/skills/*/SKILL.md`                  |
| Manual Prompts        | `.cursor/commands/*.md`     | Skills with `disable-model-invocation: true` |
| Ignore Patterns       | `.cursorignore`             | `permissions.deny` rules                     |

These translations preserve both meaning and behavior, though file layout may differ.

## What Gets Approximated

Some features exist in both ecosystems but behave slightly differently. In these cases a16n chooses the closest equivalent and warns you.

| Feature         | From   | To     | Behavior                             |
| --------------- | ------ | ------ | ------------------------------------ |
| Ignore patterns | Cursor | Claude | ≈ Converted to read-deny permissions |

Approximate translations are chosen to keep **agent behavior as close as possible** to the original configuration.

## What Gets Skipped

Some features simply do not exist in the target toolchain. These are skipped and reported.

| Feature           | From   | To     | Reason                                                    |
| ----------------- | ------ | ------ | --------------------------------------------------------- |
| Complex Commands  | Cursor | Claude | `$ARGUMENTS`, `!`, and `allowed-tools` have no equivalent |
| Skills with hooks | Claude | Cursor | Hooks are Claude-specific                                 |

## Structural Differences and Non-Invertibility

Because a16n prioritizes behavior, the translated configuration may not always look like the original.

Two related effects cause this:

* **Structural differences** - the configuration is reorganized but still behaves the same
* **Non-invertibility** - converting and then converting *back* again cannot reproduce the exact original layout

These are related, but not the same.

### Structural Differences

Some configurations have multiple valid representations across tools. a16n selects the form that best preserves behavior and intent.

#### Example: Global Prompts in Subdirectories

A subdirectory `CLAUDE.md` is behaviorally equivalent to a file-scoped rule at the root.

| Claude Code                  | Cursor                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| `packages/foo/src/CLAUDE.md` | `.cursor/rules/CLAUDE.mdc` with `globs: packages/foo/src/**` |

However, this loses important structural meaning: the rule was clearly intended to live inside the package.

A more faithful translation is to create `packages/foo/src/.cursor/rules/CLAUDE.mdc` with `alwaysApply: true` frontmatter.

This preserves the "global rule for this package" structure while maintaining identical agent behavior.

---

### Non-Invertible Translations

Some layouts cannot be converted back to their exact original form.

This typically happens when multiple sources collapse into one representation.

Example Cursor layout:

```
packages/
└── foo/
    └── src/
        └── .cursor/
            └── rules/
                ├── rule1.mdc
                └── rule2.mdc
```

Claude supports only a single `CLAUDE.md` per directory. Merging these rules is ambiguous and not repeatable.

A *safer translation* is to hoist them:

```
.claude/
└── rules/
    ├── rule1.md
    └── rule2.md
```

with

```yaml
paths:
  - "packages/foo/src/**"
```

This keeps conversions predictable but loses the original directory-local structure.

Once this happens, converting back cannot recreate the exact original layout. The intuitive translation would be to place both of the rules in `.cursor/rules/`, and use `globs:` to match the `paths:` spec. However identical *behavior* would come from emitting them to `.cursor/rules/foo/src/`, with no globs, just `alwaysApply: true` frontmatter.

At translation time, the Cursor plugin cannot determine that what it sees in `.claude/rules/` was hoisted from a previous Cursor layout that was nested. Whichever output format it chooses will be *uninformed*, and this is likely to lead to drift when trying to "round-trip" translations.

Plugins should consider such edge cases and make sure to emit warnings when appropriate, especially if a less-faithful ("lossy") translation is chosen.

## Example Warning Output

When you run a conversion, a16n reports what happened:

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

Warnings describe situations where translation cannot be exact.

| Code                  | Icon | Meaning                        |
| --------------------- | ---- | ------------------------------ |
| `merged`              | ⚠    | Multiple sources combined      |
| `approximated`        | ≈    | Nearest equivalent used        |
| `skipped`             | ⊘    | Feature unsupported            |
| `overwritten`         | ↺    | Existing file replaced         |
| `file-renamed`        | →    | Renamed to avoid collision     |
| `boundary-crossing`   | ⚠    | Git-ignore boundary crossed    |
| `git-status-conflict` | ⚠    | Mixed git-ignore states        |
| `version-mismatch`    | ⚠    | IR version mismatch            |
| `orphan-path-ref`     | ⚠    | Missing referenced source path |

Warnings do not affect exit codes.

## JSON Output Example

```json
{
  "warnings": [
    {
      "code": "approximated",
      "message": "AgentIgnore approximated as permissions.deny"
    }
  ]
}
```

## Path Reference Rewriting

Some configurations reference files using source-format paths.

Example:

```
Load: .cursor/rules/shared/auth.mdc
```

After conversion the file may live at:

```
.claude/rules/auth.md
```

Use:

```bash
a16n convert --rewrite-path-refs .
```

This updates references automatically.

If a referenced file was not part of the conversion, a16n emits an `orphan-path-ref` warning.

## Learn More

* [CLI Reference](/cli/reference)
* [FAQ](/faq)
