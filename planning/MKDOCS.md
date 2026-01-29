# Documentation Site Brief (MkDocs + RTD Alternative)

## Decision: Per-Package MkDocs Sites with Read the Docs Hosting

Each publishable package gets its own MkDocs documentation site and RTD project. This enables per-package versioned docs that track each package's independent release cadence.

## Architecture

```
packages/
  core/
    docs/
      mkdocs.yml          # standalone site config
      index.md            # hand-written guides
      getting-started.md
      api.md              # mkdocstrings directives
    src/
    package.json
    README.md             # quick-start, shown on npm
  cli/
    docs/
      mkdocs.yml
      index.md
      api.md
    src/
    package.json
    README.md
```

Each `docs/` folder is self-contained. No centralized docs workspace.

## Toolchain

| Tool | Purpose |
|------|---------|
| MkDocs | Static site framework |
| mkdocs-material | Theme (recommended for consistency across packages) |
| mkdocstrings | Extracts API docs from source |
| griffe-typedoc | TypeScript/TSDoc handler for mkdocstrings |

## Per-Package Setup

```toml
# packages/core/docs/pyproject.toml (or shared at repo root)
[project]
name = "docs"
requires-python = ">=3.10"

[project.optional-dependencies]
docs = [
    "mkdocs>=1.5",
    "mkdocs-material>=9",
    "mkdocstrings[python]>=0.24",
    "mkdocstrings-typescript>=0.2",
]
```

```yaml
# packages/core/docs/mkdocs.yml
site_name: "@scope/core"
site_url: https://my-scope-core.readthedocs.io/

theme:
  name: material

plugins:
  - search
  - mkdocstrings:
      handlers:
        typescript:
          options:
            paths: [../src]

nav:
  - Home: index.md
  - Getting Started: getting-started.md
  - API Reference: api.md
```

```markdown
<!-- packages/core/docs/api.md -->
# API Reference

::: index.ts
```

## Interlinking Between Package Sites

```yaml
# packages/core/docs/mkdocs.yml
nav:
  - Home: index.md
  - API Reference: api.md
  - Related:
      - CLI Docs: https://my-scope-cli.readthedocs.io/

# Or inline in markdown:
# See the [CLI documentation](https://my-scope-cli.readthedocs.io/en/stable/)
```

## Read the Docs Configuration

One RTD config per package:

```yaml
# packages/core/.readthedocs.yaml
version: 2

build:
  os: ubuntu-22.04
  tools:
    python: "3.11"
    nodejs: "18"

mkdocs:
  configuration: docs/mkdocs.yml

python:
  install:
    - method: pip
      path: docs
      extra_requirements:
        - docs
```

## RTD Project Setup

Create separate RTD projects, each pointing to the same Git repo:

| RTD Project | Config Path | Tag Pattern |
|-------------|-------------|-------------|
| `my-scope-core` | `packages/core/.readthedocs.yaml` | `^core@` |
| `my-scope-cli` | `packages/cli/.readthedocs.yaml` | `^cli@` |

Configure tag pattern filtering in RTD dashboard → Versions → "Version matching" so each project only builds versions for its package.

## Tagging Strategy

Use scoped tags so RTD can filter:

```bash
git tag core@1.2.3
git tag cli@2.0.0
```

RTD version picker for `my-scope-core` shows: `latest`, `1.2.3`, `1.2.2`, ...
RTD version picker for `my-scope-cli` shows: `latest`, `2.0.0`, `1.1.0`, ...

## Key Constraints

1. **No generated content committed.** Each `docs/site/` is gitignored. RTD builds from source at each Git ref.
2. **Docs live with their package.** `packages/foo/docs/` contains all docs for `@scope/foo`.
3. **README.md stays in package root** for npm/GitHub discoverability.

## User Flow

1. User installs `@scope/core@1.2.3`
2. npm page links to `https://my-scope-core.readthedocs.io/`
3. User selects version `1.2.3` from picker
4. Docs rendered from `core@1.2.3` tag—API docs match installed version exactly

## Trade-offs

| | Per-Package RTD | Unified Docusaurus |
|---|---|---|
| Per-package version picker | ✅ Native | ❌ Not feasible |
| Unified site | ❌ Separate sites, interlinked | ✅ Single site |
| Consistent styling | Via shared mkdocs-material config | Native |
| JS-native toolchain | ❌ Python + Node | ✅ Pure Node |
| Setup overhead | One RTD project per package | One project total |

## Open Questions for Spike

1. How mature is griffe-typedoc / mkdocstrings-typescript? Test against actual codebase.
2. Does TSDoc comment extraction work as expected?
3. RTD free tier limits—acceptable across multiple projects?
4. Shared Python deps: single `pyproject.toml` at repo root, or per-package?
