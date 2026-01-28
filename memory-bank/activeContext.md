# Memory Bank: Active Context

<!-- This file tracks current session focus, recent decisions, and immediate next steps. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Focus

**Task:** DOCS-SITE-MVP - Docusaurus documentation site with TypeDoc API generation

**Status:** Planning Complete - Ready for Build Phase

**Goal:** Prove the documentation pipeline works with placeholder prose. API generation should be fully functional; users can fill in detailed guides later.

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| `apps/docs/` location | Follows spec; separates docs from library packages |
| Docusaurus 3 + TypeDoc | JS-native, no Python; TypeDoc replaces mkdocs-merge workflow |
| Placeholder prose | Proves pipeline; users fill in later |
| GitHub Pages via workflow | CI builds fresh; no generated content in repo |
| TypeDoc per-package | Each package gets its own API section |

## Implementation Sequence

1. **Project Structure** → `apps/docs/` scaffolding
2. **Docusaurus Config** → Core site configuration
3. **Placeholder Guides** → One `index.md` per package
4. **TypeDoc Integration** → API doc generation
5. **Turbo Integration** → Build task orchestration
6. **CI Workflow** → GitHub Pages deployment
7. **Verification** → Full build test

## Immediate Next Steps

1. Start `/build` phase
2. Create `apps/docs/` directory structure
3. Install Docusaurus + TypeDoc dependencies
4. Configure TypeDoc for all 6 packages

## Recent Completed Work

| Phase | Completion Date | Archive |
|-------|-----------------|---------|
| Phase 7 | 2026-01-28 | [AgentSkills Standard](archive/features/20260128-PHASE-7-AGENTSKILLS.md) |
| Phase 6 | 2026-01-28 | [CLI Polish](archive/enhancements/20260128-PHASE6-CLI-POLISH.md) |
| Phase 5 | 2026-01-28 | [Git Ignore + Conflict Flag](archive/features/20260128-PHASE5-CONFLICT-FLAG.md) |
