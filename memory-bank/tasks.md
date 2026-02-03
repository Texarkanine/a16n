# Memory Bank: Tasks

## Current Task: Phase 9 - IR Serialization Plugin

**Complexity**: Level 3 (Intermediate - multiple components, architectural decisions)

**Objective**: Create `@a16njs/plugin-a16n-ir` to persist and read the a16n intermediate representation to/from disk with versioned migration support.

---

## Task Overview

### Core Deliverables

1. **IR File Format Definition**
   - Directory structure: `.a16n/<IRType>/<Name>.md`
   - YAML frontmatter with metadata + content body
   - Version field in all IR types

2. **IR Model Updates**
   - Add `version` field to base IR type
   - Start all versions at `v1beta1`
   - Version compatibility checking

3. **Plugin Implementation**
   - Discovery: Parse `.a16n/` directory structure
   - Emission: Write versioned IR files
   - Version mismatch warnings

4. **Migration Workflow**
   - Document migration path via intermediate format
   - Future consideration: multi-plugin support

---

## Milestones

### M1: IR Model Versioning
- [ ] Add `version` field to `CustomizationItem` base type
- [ ] Define version format (Kubernetes-style: `v1beta1`, `v1`, etc.)
- [ ] Add version validation utilities
- [ ] Update all existing IR types to include version

### M2: Plugin Package Setup
- [ ] Create `packages/plugin-a16n-ir/` package structure
- [ ] Configure package.json, tsconfig, build
- [ ] Register plugin with engine

### M3: IR Emission (--to a16n)
- [ ] Implement `emit()` function
- [ ] Generate `.a16n/<Type>/<name>.md` files
- [ ] Write YAML frontmatter with all metadata
- [ ] Handle file naming (slugify names)

### M4: IR Discovery (--from a16n)
- [ ] Implement `discover()` function
- [ ] Parse `.a16n/` directory structure
- [ ] Parse frontmatter and content
- [ ] Version compatibility checking with warnings

### M5: Testing & Documentation
- [ ] Unit tests for emission
- [ ] Unit tests for discovery
- [ ] Round-trip integration tests
- [ ] Update CLI documentation

---

## Creative Phases Identified

### Creative #1: IR Migration Strategy

**Question**: How should users migrate IR files when the IR schema version changes?

**Options**:
1. **Intermediate format only**: `--to cursor` (old a16n), update a16n, `--from cursor --to a16n`
2. **Version-suffixed plugins**: `--from a16n-v1beta1 --to a16n-v1`
3. **Version flags**: `--source-version v1beta1 --target-version v1`
4. **Accept limitation**: Document that migration requires intermediate step

**Current Recommendation**: Option 1 (intermediate format) for simplicity. Document clearly.

---

## Dependencies

- Existing `@a16njs/models` IR types
- Existing plugin interface in `@a16njs/engine`
- YAML parsing (gray-matter already used in other plugins)

---

## Planning Status

- [x] Roadmap updated with Phase 9 and Phase 10
- [x] Phase 9 spec file created (`planning/PHASE_9_SPEC.md`)
- [x] Migration strategy decided (use intermediate format)
- [x] Implementation ready to begin

---

## Recent Archives

See `memory-bank/archive/` for completed task documentation.
