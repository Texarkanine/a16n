# Memory Bank: Active Context

<!-- This file tracks current session focus, recent decisions, and immediate next steps. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Focus

**Task:** MKDOCS-SPIKE - MkDocs Documentation Site Spike  
**Status:** 🔄 PLANNING COMPLETE  
**Goal:** Evaluate MkDocs + mkdocstrings-typescript as alternative to Docusaurus for per-package versioned docs

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Per-package `docs/` folders | Matches MKDOCS.md spec; enables independent versioning |
| Start with `@a16njs/models` | Smallest package, well-typed, good test candidate |
| Repo-root `pyproject.toml` | Shared deps avoid duplication; RTD can reference |
| Python venv isolation | Keep Python deps separate from pnpm workspace |
| Spike-first approach | Validate tooling before full implementation |

## Implementation Sequence

1. **Python Toolchain Setup** → `pyproject.toml` + dependencies
2. **Single Package POC** → `packages/models/docs/` as proof-of-concept
3. **TypeScript Extraction Test** → Verify mkdocstrings-typescript works
4. **Expansion** → Remaining packages (if POC succeeds)
5. **RTD Config** → `.readthedocs.yaml` templates
6. **Documentation** → Record findings, compare to Docusaurus

## Critical Questions to Answer

These must be answered by the spike:

1. **mkdocstrings-typescript maturity** — Does it work at all with our codebase?
2. **TSDoc extraction** — Are comments/descriptions extracted from source?
3. **Type rendering** — How well does it handle complex TypeScript types?
4. **Build stability** — Any version conflicts like Docusaurus/TypeDoc had?

## Immediate Next Steps

1. Create feature branch `feat/mkdocs-docs-spike`
2. Create `pyproject.toml` at repo root
3. Set up Python virtual environment
4. Install MkDocs + mkdocstrings-typescript
5. Create `packages/models/docs/` proof-of-concept
6. Test TypeScript API generation

## Context from Docusaurus Spike

The prior Docusaurus spike (`reflection-DOCS-SITE-MVP.md`) encountered:

- TypeDoc plugin version conflicts (typedoc@0.27.9 vs plugins needing 0.28.x)
- API doc generation was deferred due to these conflicts
- Overall site structure worked, placeholder content created

This MkDocs spike explores whether the Python-based mkdocstrings ecosystem has better TypeScript support.

## Files to Create

```
pyproject.toml                          # Repo-root Python deps
.gitignore                              # Add Python patterns (venv/, etc.)
packages/models/docs/
├── mkdocs.yml                          # MkDocs site config
├── index.md                            # Package overview
└── api.md                              # mkdocstrings directive
```

## Recent Completed Work

| Phase | Completion Date | Archive |
|-------|-----------------|---------|
| DOCS-SITE-MVP (Docusaurus) | 2026-01-28 | [Reflection](reflection/reflection-DOCS-SITE-MVP.md) |
| Phase 7 | 2026-01-28 | [AgentSkills Standard](archive/features/20260128-PHASE-7-AGENTSKILLS.md) |
| Phase 6 | 2026-01-28 | [CLI Polish](archive/enhancements/20260128-PHASE6-CLI-POLISH.md) |
