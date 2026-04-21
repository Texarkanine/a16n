# a16n Documentation Site

[![Docusaurus](https://img.shields.io/badge/built%20with-Docusaurus-3ECC5F)](https://docusaurus.io/)

Docusaurus-based documentation site for the [a16n](https://github.com/Texarkanine/a16n) project.

**Live site:** [texarkanine.github.io/a16n](https://texarkanine.github.io/a16n/)

## "I want to…" → run this

| Goal | Command |
| --- | --- |
| **Rebuild prose and launch the server** - I edited markdown (no API docs) | `docs:dev:prose` |
| **Rebuild everything from scratch**, slow, same as the deploy pipeline | `docs:build:all` |
| **Just launch the server** - `.generated/` is already current, I want to browse it | `docs:dev:only` |
| **Regenerate content from markdown**, no server | `docs:gen:prose` |

Everything else is a deliberate composition of the same few primitives. Pick the entrypoint whose inputs you need and whose output matches your workflow - or compose your own from `docs:gen:*` + `docs:site:*`.

## How the scripts compose

Three verbs, deterministic composition:

- **`docs:gen:*`** - fill `.generated/` with what Docusaurus should see. No server, no build.
- **`docs:site:*`** - hand `.generated/` to Docusaurus. Either `start` (dev server) or `build` (production output under `build/`).
- **`docs:dev:*`** - for iterative development; launches the server
- **`docs:build:*`** - build the site; usually for production CI and/or headless content validation

The suffix on every entrypoint picks *how much* to (re)generate - always in the same order, cheapest first:

1. `only` *(dev only)* - no generation; serve `.generated/` as-is
2. `prose` - hand-written markdown + changelogs (fastest; catches most MDX breakage)
3. `current` - `prose` + current API reference + CLI reference (what CI gates on)
4. `all` *(build only)* - `current` + versioned API built from git tags (slow; deploy only)

## Script reference

### Entrypoints - what you actually type

| Script | Composition | When to use |
| --- | --- | --- |
| `docs:dev:only` | `docs:gen:none` → `docs:site:start` | Browse existing `.generated/` - fastest feedback loop |
| `docs:dev:prose` | `docs:gen:prose` → `docs:site:start` | Iterating on markdown or changelogs |
| `docs:dev:api` | `docs:gen:current` → `docs:site:start` | Iterating on TypeScript behind the current API reference |
| `docs:build:prose` | `docs:gen:prose` → `docs:site:build` | Fastest production-build sanity check (no TypeDoc) |
| `docs:build:current` | `docs:gen:current` → `docs:site:build` | **CI docs gate** - [`.github/workflows/ci.yaml`](../../.github/workflows/ci.yaml) |
| `docs:build:all` | `docs:gen:versioned` → `docs:site:build` | **Deploy** - [`.github/workflows/docs.yaml`](../../.github/workflows/docs.yaml) |

### Generation

( populates `.generated/` only, no Docusaurus)

| Script | Composition |
| --- | --- |
| `docs:gen:none` | no-op (lets `docs:dev:only` share the `gen → site:start` shape) |
| `docs:gen:prose` | `docs:sync` |
| `docs:gen:current` | `docs:gen:prose` → `docs:gen:api:current` |
| `docs:gen:versioned` | `docs:gen:prose` → `docs:gen:api:versioned` |

### Lower-level primitives

| Script | What it does |
| --- | --- |
| `docs:sync` | Wipe and repopulate `.generated/` with hand-written prose and changelogs |
| `docs:gen:api:current` | TypeDoc + CLI reference for the working tree |
| `docs:gen:api:versioned` | TypeDoc across historical git tags (slow - walks release history) |
| `docs:site:start` | `docusaurus start` on `.generated/` |
| `docs:site:build` | `docusaurus build` on `.generated/` → `build/` |

## Structure

- `docs/` - hand-written prose documentation (committed)
- `.generated/` - staging area consumed by Docusaurus (gitignored)
- `build/` - Docusaurus production output (gitignored)
- `scripts/` - API and changelog generation scripts
- `src/components/` - custom React components (`VersionPicker`, etc.)

For detailed development instructions, see the [a16n Documentation](https://texarkanine.github.io/a16n/).
