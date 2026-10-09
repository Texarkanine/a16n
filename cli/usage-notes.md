# Usage Notes

> Explanation for options and commands whose reference entry leaves out something you need in order to use them

The [CLI Reference](/cli/reference) lists every command and option. When that listing leaves out something you need in order to use an option or command, the explanation belongs here, as its own section.

## Git Ignore Styles

`--gitignore-output-with` chooses how converted files are git-ignored. It writes in the target repository (`--to-dir` when that flag is set).

| Style | What it writes | Who it affects |
| --- | --- | --- |
| `none` | Nothing | |
| `ignore` | `.gitignore` in the target checkout | That checkout, until the `.gitignore` change is committed |
| `exclude` | `info/exclude` | The whole target repository, including every linked worktree |
| `hook` | `hooks/pre-commit` | The whole target repository. The hook unstages those paths on commit |
| `match` | The same kind of file that ignores the source | A source ignored through `info/exclude` is written as `exclude` |

`--if-gitignore-conflict` values `exclude` and `hook` write those same repository files.

:::warning Repository-wide

`exclude` and `hook` update files Git shares with every linked worktree. Running either one inside a worktree changes the main checkout too. `hook` unstages the listed paths on commit in every worktree. `match` and `--if-gitignore-conflict` do this when they select `exclude` or `hook`.

:::

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

**Interaction With Other Flags:**
- `--delete-source` deletes from the source directory (i.e., `--from-dir` if set)
- `--gitignore-output-with` operates against the target directory (i.e., `--to-dir` if set)

## Path Reference Rewriting

When your source files reference other source files by path (e.g., a Cursor rule that says `Load: .cursor/rules/auth.mdc`), those references may be stale after conversion if the target format uses different paths.

The `--rewrite-path-refs` flag automatically updates these path references during conversion:

```bash
a16n convert --from cursor --to claude --rewrite-path-refs .
```

**How It Works:**

1. a16n discovers source items and performs a dry-run emit to learn the target paths
2. It builds a mapping of source paths → target paths (e.g., `.cursor/rules/auth.mdc` → `.claude/rules/auth.md`)
3. It rewrites content using exact string replacement (longest match first, to prevent partial match corruption)
4. It emits the rewritten items to disk

**What Gets Rewritten:**

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

**Orphan Warnings:**

If a file references a source-format path that isn't in the conversion set (e.g., `.cursor/rules/missing.mdc` where `missing.mdc` doesn't exist), a16n emits an `orphan-path-ref` warning so you can fix it manually.

Orphan-reference scanning is scoped to only candidates for rewriting, so un-rewritten paths inside `assets/` or unknown subtrees never produce spurious orphan warnings.
