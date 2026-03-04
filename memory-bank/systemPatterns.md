# System Patterns

## How This System Works

a16n is a plugin-based conversion engine. The core flow:

```mermaid
flowchart LR
    A["Source Plugin.discover(root)"] --> B["AgentCustomization[] (IR)"]
    B --> C["Target Plugin.emit(root)"]
```

A **source plugin** reads tool-specific configuration files from disk and normalizes them into an intermediate representation (IR). A **target plugin** takes that IR and writes it out as configuration files for a different tool. The **engine** orchestrates this: it resolves plugins by id, runs discovery, applies an optional transformation pipeline (e.g., path rewriting), then runs emission.

Three plugins are bundled: `cursor`, `claude`, and `a16n` (the IR format itself, stored under `.a16n/`). Installed plugins (npm packages named `a16n-plugin-*`) are discovered at runtime, but bundled plugins win on id conflict by default.

**Before you touch anything, know this:**

- The `A16nPlugin` interface (`discover` + `emit`) is the contract everything depends on. Changing it ripples through every plugin and the engine.
- IR types live in `@a16njs/models`. Adding a new `CustomizationType` requires updates to every plugin that should support it.
- `discover` and `emit` accept `string | Workspace`. The engine passes `LocalWorkspace`; tests use `MemoryWorkspace` / `ReadOnlyWorkspace`.
- `metadata` on IR items is transient — it is never serialized. It carries tool-specific hints between discover and emit within a single conversion.
- `relativeDir` on IR items preserves subdirectory structure across conversion (e.g., `.cursor/rules/shared/foo.mdc` → `.claude/rules/shared/foo.md`). Emit validates it to prevent path traversal.
- `WrittenFile.sourceItems` links each emitted file back to its source IR items. This powers path-reference rewriting and `--delete-source`.

## Discovery/Emit Asymmetries

Plugins do not necessarily round-trip to the same file locations. These asymmetries are intentional, with the goal of preserving accuracy and intent. Do not "fix" them without understanding why they exist.

## Classification Priority Orders

Both plugins classify source files into IR types using strict priority orders. Reordering these changes behavior.

**Cursor MDC files** (`.cursor/rules/**/*.mdc`):
1. `alwaysApply: true` → GlobalPrompt
2. Non-empty `globs` → FileRule
3. `description` present → SimpleAgentSkill
4. None of the above → ManualPrompt

**Claude SKILL.md files** (`.claude/skills/**/SKILL.md`):
1. `hooks:` present → **SKIP** (warning: not supported by AgentSkills.io)
2. Extra files in skill directory → AgentSkillIO
3. `disable-model-invocation: true` → ManualPrompt
4. `description` present → SimpleAgentSkill
5. None of the above → **SKIP** (warning: missing description)

## Skill Directory Model

Skills follow the pattern `.<tool>/skills/<name>/SKILL.md`. The first directory containing a `SKILL.md` is the skill root; its subdirectories are resource directories (read recursively by `readSkillFiles()`), not nested skills. Directories without `SKILL.md` are treated as categories and recursed into.

The skill's **invocation name** is always the immediate parent directory name of `SKILL.md`, not any `name` field in frontmatter.

## Warn-and-Continue Error Philosophy

The system fails fast on invalid input (bad syntax, missing required fields) but warns and continues on capability gaps. Every skipped or approximated item produces a warning. Warnings are aggregated and reported at the end, not inline. See `WarningCode` in `@a16njs/models` for the canonical set.

## Fixture-Based Integration Testing

Integration tests use fixture directories: `test/integration/fixtures/<tool>-<feature>/from-<tool>/` with expected output in `expected-<tool>/`. This convention is consistent across all packages.
