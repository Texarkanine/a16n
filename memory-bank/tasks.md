# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task

**ID:** MKDOCS-SPIKE  
**Title:** MkDocs Documentation Site Spike  
**Status:** 🔄 PLANNING COMPLETE  
**Complexity:** Level 3 (Intermediate Feature - spike with unknowns)  
**Branch:** `feat/mkdocs-docs-spike`

## Task Overview

Spike out the MkDocs-based documentation approach described in `planning/MKDOCS.md`. This is an alternative to the Docusaurus approach (spiked on a different branch, see `memory-bank/reflection/reflection-DOCS-SITE-MVP.md`).

**Goal:** Evaluate whether MkDocs + mkdocstrings-typescript can generate per-package versioned documentation with automatic API doc generation from TypeScript sources.

## Critical Finding from Research

**mkdocstrings-typescript uses TypeDoc under the hood!** This means:

| Aspect | Implication |
|--------|-------------|
| TypeDoc dependency | Same underlying tool as Docusaurus approach |
| Build requirement | Packages must be compiled to `.d.ts` first |
| Entry points | Uses `src/index.d.ts`, not raw TypeScript |
| Maturity | Explicitly in "prototyping phase" |

This changes the comparison:

| | Docusaurus + typedoc-plugin-markdown | MkDocs + mkdocstrings-typescript |
|---|---|---|
| Underlying tool | TypeDoc | TypeDoc (via Python wrapper) |
| Extra layer | Docusaurus plugin | Python + mkdocstrings |
| Maturity | Plugin had version conflicts | "Prototyping phase" |
| Complexity | Node.js only | Node.js + Python |

The spike will now evaluate whether the Python wrapper provides any benefit over direct TypeDoc integration.

## Key Differences from Docusaurus Spike

| Aspect | Docusaurus | MkDocs |
|--------|------------|--------|
| Toolchain | Pure Node.js | Python + Node.js (TypeDoc) |
| API Generation | typedoc-plugin-markdown | mkdocstrings + griffe-typedoc (still uses TypeDoc) |
| Hosting | GitHub Pages (unified site) | Read the Docs (per-package sites) |
| Versioning | Manual | Per-package via RTD + tag patterns |
| Structure | `apps/docs/` unified | `packages/*/docs/` per-package |

## Packages to Document (6 total)

| Package | npm Name | Purpose |
|---------|----------|---------|
| `models` | `@a16njs/models` | Shared types and plugin interface |
| `engine` | `@a16njs/engine` | Conversion orchestration |
| `cli` | `a16n` | CLI package |
| `plugin-cursor` | `@a16njs/plugin-cursor` | Cursor IDE support |
| `plugin-claude` | `@a16njs/plugin-claude` | Claude Code support |
| `glob-hook` | `@a16njs/glob-hook` | Glob matcher for Claude hooks |

## Open Questions to Answer

From `planning/MKDOCS.md` + research findings:

1. **Does mkdocstrings-typescript work better than typedoc-plugin-markdown?** Both use TypeDoc.
2. **Does TSDoc comment extraction work?** Via TypeDoc.
3. **Is the extra Python layer worth it?** Adds complexity.
4. **RTD free tier limits** — acceptable across 6 projects?
5. **Shared Python deps:** single `pyproject.toml` at repo root, or per-package?
6. **Build requirement:** Do we need to build packages first for docs?

## Implementation Plan

### Phase 1: Python Toolchain Setup
- [ ] Create repo-root `pyproject.toml` with MkDocs dependencies
- [ ] Add Python `.gitignore` patterns (venv, __pycache__, etc.)
- [ ] Create Python virtual environment
- [ ] Install dependencies: `pip install mkdocs mkdocs-material mkdocstrings-typescript`
- [ ] Verify MkDocs CLI works (`mkdocs --version`)

### Phase 2: TypeDoc Configuration
- [ ] Create root `typedoc.base.json`
- [ ] Create root `typedoc.json` for monorepo
- [ ] Create `packages/models/typedoc.json` for single package
- [ ] Ensure packages are built (`pnpm build`)
- [ ] Test TypeDoc directly first: `npx typedoc`

### Phase 3: Single Package MkDocs POC
- [ ] Create `packages/models/docs/mkdocs.yml`
- [ ] Create `packages/models/docs/index.md` (placeholder)
- [ ] Create `packages/models/docs/api.md` (mkdocstrings directive)
- [ ] Test local build: `mkdocs build -f packages/models/docs/mkdocs.yml`
- [ ] Verify API doc generation

### Phase 4: Evaluate Results
- [ ] Document what works and what doesn't
- [ ] Compare output quality to TypeDoc alone
- [ ] Compare complexity to Docusaurus approach
- [ ] Note any version conflicts or issues

### Phase 5: Per-Package Expansion (if Phase 4 succeeds)
- [ ] Create `docs/` structure for remaining 5 packages
- [ ] Each package gets: `mkdocs.yml`, `index.md`, `api.md`
- [ ] `typedoc.json` for each package
- [ ] Placeholder prose in each `index.md`

### Phase 6: Read the Docs Configuration (if Phase 4 succeeds)
- [ ] Create `packages/models/.readthedocs.yaml` as template
- [ ] Document RTD project setup instructions
- [ ] Note free tier limitations discovered

### Phase 7: Documentation & Findings
- [ ] Update `planning/MKDOCS.md` with findings
- [ ] Create reflection document with spike results
- [ ] Compare pros/cons against Docusaurus spike
- [ ] Recommend final approach

## Success Criteria

**Spike Success (must achieve all):**
1. MkDocs builds locally without errors
2. mkdocstrings-typescript generates *some* API documentation from TypeScript
3. Per-package structure works as designed
4. Clear documentation of what works and limitations

**Spike Failure (any one blocks adoption):**
1. mkdocstrings-typescript cannot parse TypeScript / .d.ts at all
2. No TSDoc comment extraction whatsoever
3. Python wrapper provides no benefit over direct TypeDoc
4. Complexity outweighs benefits vs Docusaurus

## Technology Stack

```toml
# pyproject.toml (planned)
[project]
name = "a16n-docs"
requires-python = ">=3.10"

[project.optional-dependencies]
docs = [
    "mkdocs>=1.5",
    "mkdocs-material>=9",
    "mkdocstrings[python]>=0.24",
    "mkdocstrings-typescript>=0.2",
]
```

**Additional Node.js requirement:**
- TypeDoc must be available (already in devDependencies or install globally)

## Test Plan

Since this is a spike, "testing" is manual verification:

1. **Build Test:** `mkdocs build` completes without errors
2. **Content Test:** Generated HTML includes API documentation
3. **TypeScript Test:** At least some TypeScript types appear in docs
4. **Serve Test:** `mkdocs serve` provides working local preview
5. **Comparison Test:** Quality vs direct TypeDoc output

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| mkdocstrings-typescript is immature | **High** | High | Explicit "prototyping phase" |
| TypeDoc version conflicts (like Docusaurus) | Medium | High | Test specific versions |
| Python/Node interop issues | Medium | Medium | Isolated virtual environment |
| RTD limits block adoption | Low | Medium | Research before committing |
| Extra complexity not worth it | High | Medium | Compare to Docusaurus |

## References

- Spec: `planning/MKDOCS.md`
- Prior art: `memory-bank/reflection/reflection-DOCS-SITE-MVP.md` (Docusaurus spike)
- mkdocstrings-typescript: https://mkdocstrings.github.io/typescript/
- griffe-typedoc: https://mkdocstrings.github.io/griffe-typedoc/
- TypeDoc: https://typedoc.org/

## Decision Point

After completing Phase 4, we'll have enough information to decide:

1. **Proceed with MkDocs** if it provides meaningful benefits over Docusaurus
2. **Return to Docusaurus** if MkDocs adds complexity without benefit
3. **Manual API docs** if both automated approaches fail
4. **Hybrid approach** if neither tool handles TypeScript well
