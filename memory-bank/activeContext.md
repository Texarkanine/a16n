# Memory Bank: Active Context

## Current Focus

**Task**: Phase 9 - IR Serialization Plugin (`@a16njs/plugin-a16n-ir`)

**Phase**: Planning → Spec authorship

**Status**: Creating PHASE_9_SPEC.md

---

## Recent Actions

1. Cleaned up ROADMAP.md - collapsed completed Phases 1-8 to summary table
2. Added Phase 9 (IR Serialization Plugin) to roadmap
3. Added Phase 10 (MCP Configuration Support) to roadmap
4. Updated tasks.md with Phase 9 breakdown

---

## Key Decisions Made

- **IR file format**: `.a16n/<IRType>/<Name>.md` with YAML frontmatter
- **Version format**: Kubernetes-style (`v1beta1`, `v1`, etc.)
- **Version compatibility**: Versions are NOT compatible across boundaries
- **Migration path**: Via intermediate format (simplest approach)

---

## Open Questions

1. **Multi-plugin conversion**: How to enable direct IR version migration?
   - Current answer: Use intermediate format (e.g., `--to cursor`, then `--from cursor --to a16n`)
   - May revisit if this becomes a pain point

2. **Non-markdown IR types**: Future consideration for MCPConfig → JSON files

---

## Next Steps

1. Create PHASE_9_SPEC.md with full acceptance criteria
2. Review spec for completeness
3. Begin implementation with M1 (IR Model Versioning)

---

## Files Being Modified

- `planning/ROADMAP.md` - Updated ✓
- `planning/PHASE_9_SPEC.md` - Creating
- `memory-bank/tasks.md` - Updated ✓
