# UI/UX Decision: CLI flag essays

## User & Context

Readers are developers converting agent configuration. The task on these pages is to learn what a convert flag actually does when `--help` is not enough: which files change, which checkout is affected, which paths get rewritten.

The CLI overview (`packages/docs/docs/cli/index.md`) currently does three jobs: install and copy-paste examples, essays about flags with consequences, and a description of stdout, JSON, and exit codes. Beside it, CLI Reference is generated from Commander and carries a version picker. That generation is the slow path, so narrative stays in hand-written prose and is previewed with `docs:dev:prose`.

Three essays sit in the middle of the overview:

- Git ignore styles covers `--gitignore-output-with` and `--if-gitignore-conflict`
- Split directories covers `--from-dir` and `--to-dir`
- Path reference rewriting covers `--rewrite-path-refs`

The same path-rewrite scope table also appears under Understanding Conversions. The FAQ answers split directories and path rewriting in a few lines.

Constraints: one home for the fact that `exclude` and `hook` are repository-wide. Headings must stand alone in the sidebar. A behavior may cover more than one flag. No new visual chrome.

## Design System

Docs chrome is the Texarkanine paper/ember Infima tokens in `packages/docs/src/css/custom.css`. These options use the existing Docusaurus page, sidebar, table, and admonition patterns.

## Options Evaluated

- **Shared section shape**: Keep the three essays on the overview. Each behavior keeps a concept heading, a one-sentence lead, a table, and the surprising consequence. The right-hand table of contents is the navigation.

```
CLI Overview
  Installation
  Examples
  Git ignore styles
  Split directories
  Path reference rewriting
  Output format
```

- **One page per behavior**: The overview keeps installation, examples, output format, and links. Each essay becomes a sibling page under CLI. The page title is the behavior. A page may document a flag pair.

```
CLI
  Overview
  Git ignore styles
  Split directories
  Path reference rewriting
  Changelog
  Reference          generated, version picker
```

- **One behaviors page**: Lift the three essays onto a single sibling. The overview links to it once. The essays stay H2s on that page.

```
CLI
  Overview
  Flag behavior
    Git ignore styles
    Split directories
    Path reference rewriting
  Changelog
  Reference
```

- **Park in existing pages**: Leave the overview as examples. Path rewriting stays in Understanding Conversions, where a copy already lives. Split directories stays a FAQ answer. Git ignore styles would move to one of those homes.

## Analysis

| Criterion | Shared section shape | One page per behavior | One behaviors page | Park in existing pages |
| --- | --- | --- | --- | --- |
| Usability | One scroll. The overview gets longer with every new essay. | The reader opens the behavior they came for. Examples link across. | One extra click, then a mixed scroll. | The CLI reader leaves the CLI section to learn a flag. |
| Clarity | Three jobs share one title: start, behaviors, output. | Each page has one job. Titles already match the current H2s. | The page title has to cover unrelated flags. | Path rewriting already has two homes. Git metadata is not a conversion concept. |
| Accessibility | In-page headings. | Sidebar entries are findable on their own. | One sidebar entry, then in-page headings. | Findability depends on thinking of FAQ or Core Concepts. |
| Consistency | Matches today's page. | Matches Understanding Conversions, which gave hooks its own page. | A grab-bag page has no sibling in this site. | Splits flag behavior away from the CLI section. |
| Feasibility | Prose edit only. | Prose plus three sidebar ids. `docs:dev:prose`. | Prose plus one sidebar id. | Moves the repository-wide warning off the page that was just chosen as its home. |
| Simplicity | Smallest change today. | A stable rule for the next essay. Two of the three pages are short today. | Smallest split. The fourth essay lands in the same grab-bag. | Fewest new files. Worst fit. |

Key insights:

- The unit is already a behavior, not a flag. Git ignore styles and split directories each cover two flags. Flag-named headings would fight that.
- A section earns a page when it explains a consequence, a mode table, or a procedure. `--dry-run`, `--json`, `--quiet`, and `--verbose` stay in Examples and in the generated reference.
- Output format stays on the overview. It describes what the command prints, and it is shared by every flag.
- The generated reference stays the catalog of flags, choices, and defaults. Narrative does not move into the versioned generator.
- The repository-wide `exclude` and `hook` fact keeps a single home. A link from the overview, the FAQ, or Understanding Conversions points at that home. It does not restate the fact.

## Decision

**Selected**: One page, titled Usage notes
**Rationale**: The operator judged the CLI overview the wrong home for the three essays, and rejected hosting them on the reference landing page. One page collects Git ignore styles, Split directories, and Path reference rewriting. Usage notes is the title, because these details belong with ordinary convert use. The reference page stays the version picker and points at the overview and at Usage notes.
**Tradeoff**: The three topics share a sidebar entry. The page table of contents carries the section names.

## Implementation Notes

- `packages/docs/docs/cli/usage-notes.md` holds the three sections. The `:::warning Repository-wide` admonition stays inside Git ignore styles.
- `packages/docs/sidebars.js` lists `cli/usage-notes` after `cli/index` and before `cli/changelog`.
- Overview examples stay. After the examples, one link points at Usage notes.
- The reference landing page points at the overview and at Usage notes. It does not host the essays.
- Preview with `docs:dev:prose` or `docs:build:prose`. Do not run versioned generation.
