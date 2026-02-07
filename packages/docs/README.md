# a16n Documentation Site

[![Docusaurus](https://img.shields.io/badge/built%20with-Docusaurus-3ECC5F)](https://docusaurus.io/)

Docusaurus-based documentation site for the [a16n](https://github.com/Texarkanine/a16n) project.

**Live site:** [texarkanine.github.io/a16n](https://texarkanine.github.io/a16n/)

## Quick Start

```bash
pnpm start          # Dev server (prose only, fast)
pnpm start:full     # Dev server with current API docs
pnpm build:prose    # Production build (prose only, ~30s)
pnpm build          # Full build with versioned API docs (~4min)
```

## Structure

- `docs/` — Hand-written prose documentation (committed)
- `.generated/` — Staging area with prose + generated content (gitignored)
- `scripts/` — API doc and changelog generation scripts
- `src/components/` — Custom React components (VersionPicker, etc.)

For detailed development instructions, see the [a16n Documentation](https://texarkanine.github.io/a16n/).
