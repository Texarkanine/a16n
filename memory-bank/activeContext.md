# Memory Bank: Active Context

<!-- This file tracks current session focus, recent decisions, and immediate next steps. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Focus

**Task:** DOCS-WORKFLOW-FIX
**Phase:** Implementation Complete
**Status:** PR #20 created and ready for review

### What We're Doing

Fixing documentation deployment workflow to prevent early publication of unreleased features, and fixing Docusaurus baseUrl for GitHub Pages.

### Key Decisions Made

1. **Hybrid Trigger Strategy:** Docs workflow triggers on both:
   - Push to main with path filters (for prose updates)
   - workflow_call from release.yaml (for package releases)
   - workflow_dispatch (manual emergency fixes)

2. **Safety-First Deployment:** Added safety check job that:
   - Analyzes changed files before deploying
   - Skips deployment if non-docs code changed
   - Always deploys for workflow_call/workflow_dispatch
   - Prevents documenting unreleased APIs

3. **Single Docs Build per Release:** Release workflow calls docs once after all packages publish, avoiding N builds for N packages.

4. **Deployment Simplification:** Switch from two-job artifact upload to single-job peaceiris/actions-gh-pages for speed and simplicity.

### Immediate Next Steps

1. Fix baseUrl in docusaurus.config.js (critical - site currently broken)
2. Implement safety check in docs.yaml
3. Add docs trigger to release.yaml
4. Test and verify all scenarios

## Recent Completions

- **DOCS-COMPREHENSIVE** (2026-01-28 to 2026-01-29): Implemented versioned API documentation system with Docusaurus, git tag-based historical docs, React version picker, and build optimizations. See `memory-bank/archive/features/20260129-DOCS-COMPREHENSIVE.md`.
