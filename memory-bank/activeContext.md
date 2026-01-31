# Memory Bank: Active Context

## Current Focus

**Task**: DOCS-COMPREHENSIVE-FILL - Documentation Site Population
**Phase**: Planning Complete → Ready for Implementation
**Complexity**: Level 3

## Recent Decisions

1. **CLI Documentation**: Build versioned generation (per-tag, mirrors TypeDoc approach)
   - Commander.js exposes `.commands` and `.options` arrays
   - ~150-200 lines of code to implement
   - No suitable existing package found (commander-to-markdown is archived)

2. **Sidebar Structure**: Hybrid approach
   - "a16n" category for guides (intro, conversions, plugin dev, FAQ)
   - Package categories for reference (CLI, Engine, Models, plugins)

3. **Plugin Dev Warning**: Prominent callout at absolute top of page

4. **Links**: Version-agnostic (e.g., `/models/api` not `/models/api/0.4.0`)

5. **Package READMEs**: Add npm badges + doc site links

## Implementation Plan Summary

7 phases, can be executed sequentially or with some parallelism:

| Phase | Description | Dependencies |
|-------|-------------|--------------|
| 1 | CLI Doc Generation Infrastructure | None |
| 2 | Sidebar & Structure | Phase 1 |
| 3 | Main README Slim-Down | Phase 2 |
| 4 | Doc Site Content - Guides | Phase 3 |
| 5 | Doc Site Content - Reference | Phase 2 |
| 6 | Package READMEs | None |
| 7 | Verification & Polish | All |

## Key Files

### To Create
- `packages/docs/scripts/generate-cli-docs.ts`
- `packages/docs/docs/understanding-conversions/index.md`
- `packages/docs/docs/plugin-development/index.md`
- `packages/docs/docs/faq.md`

### Major Modifications
- `README.md` (slim down significantly)
- `packages/docs/sidebars.js` (restructure)
- All `packages/*/README.md` (badges + links)
- All `packages/docs/docs/*/index.md` (fill content)

## Next Steps

Ready to begin Phase 1: CLI Doc Generation Infrastructure

1. Create `generate-cli-docs.ts` script
2. Test on current CLI
3. Integrate with versioned generation pipeline
