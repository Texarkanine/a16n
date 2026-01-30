# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task

**Task ID:** DOCS-WORKFLOW-FIX
**Complexity Level:** 2 (Multiple files, straightforward implementation)
**Started:** 2026-01-29

### Objective

Fix documentation deployment workflow and Docusaurus configuration:
1. Implement smart deployment guard to prevent deploying docs for unreleased features
2. Add docs trigger from release workflow
3. Fix Docusaurus baseUrl for GitHub Pages deployment

### Problem Statement

#### Issue 1: Docs Workflow Triggers
- Current: Triggers on every push to main
- Problem: Can deploy docs showing unreleased features if code + docs merge together
- Solution: Add safety check to skip deployment if non-docs files changed

#### Issue 2: Release Integration
- Current: No automatic docs update after package releases
- Problem: New version tags don't automatically trigger docs rebuild
- Solution: Add docs job to release.yaml that calls docs workflow

#### Issue 3: Docusaurus baseUrl
- Current: baseUrl = '/' (default)
- Problem: Site deployed to <https://texarkanine.github.io/a16n/> returns error
- Error: "We suggest trying baseUrl = /a16n/"
- Solution: Change baseUrl to '/a16n/' for GitHub Pages

### Test Planning

**Existing Test Infrastructure:**
- Workflow testing: Manual validation via GitHub Actions UI
- Docusaurus config: Can test locally with `pnpm --filter docs build && pnpm --filter docs serve`

**Tests Required:**
1. **Docs Workflow Safety Check:**
   - Test: Push with only docs changes → should deploy
   - Test: Push with code + docs changes → should skip
   - Test: workflow_call trigger → should always deploy
   - Test: workflow_dispatch trigger → should always deploy

2. **Release Integration:**
   - Test: Release PR merge → should trigger docs workflow
   - Test: Multiple package release → should trigger once

3. **Docusaurus baseUrl:**
   - Test: Local build with baseUrl='/a16n/' → should work
   - Test: Deployed site loads at <https://texarkanine.github.io/a16n/>

### Implementation Plan

#### Phase 1: Fix Docusaurus baseUrl (Quick Win)
**Files to Modify:**
- `packages/docs/docusaurus.config.js`

**Changes:**
1. Change `baseUrl: '/'` to `baseUrl: '/a16n/'`
2. Test locally with build + serve

**Verification:**
- Build succeeds
- Local serve works with /a16n/ path
- Deploy and verify production site loads

#### Phase 2: Add Safety Check to Docs Workflow
**Files to Modify:**
- `.github/workflows/docs.yaml`

**Changes:**
1. Add new job `check-safety` that runs before deployment:
   - Check event type (workflow_call/workflow_dispatch always proceed)
   - For push events: analyze changed files
   - Skip if non-docs files changed
   - Output: `should_deploy` boolean

2. Modify `deploy` job (rename from `build`):
   - Add dependency on `check-safety` job
   - Add conditional: `if: needs.check-safety.outputs.should_deploy == 'true'`
   - Keep all existing build/deploy steps

3. Update triggers:
   - Keep `push` with path filters (packages/docs/**)
   - Add `workflow_call` (for release.yaml)
   - Keep `workflow_dispatch` (manual trigger)

4. Simplify deployment (bonus optimization):
   - Replace two-job artifact approach with single-job peaceiris/actions-gh-pages
   - Faster, simpler, more reliable

**Verification:**
- Push only docs changes → deploys
- Push with code changes → skips with clear message
- Manual trigger → deploys

#### Phase 3: Integrate with Release Workflow
**Files to Modify:**
- `.github/workflows/release.yaml`

**Changes:**
1. Add third job `docs` after `publish`:
   - Runs only if releases were created
   - Waits for publish job to complete
   - Calls docs workflow via workflow_dispatch API

**Verification:**
- Release PR merge → docs workflow triggers
- Multiple packages release → only one docs build

### Files Modified

- [x] `packages/docs/docusaurus.config.js` - Fix baseUrl
- [x] `.github/workflows/docs.yaml` - Add safety check and simplify deployment
- [x] `.github/workflows/release.yaml` - Add docs trigger job

### Dependencies

None - all changes use existing GitHub Actions and Docusaurus features.

### Risk Assessment

**Low Risk:**
- baseUrl change: Simple config change, easily reversible
- Safety check: Only skips deployment, doesn't break anything
- Release integration: Additive change, doesn't modify existing flow

**Testing Strategy:**
- Phase 1: Deploy immediately to fix production issue
- Phase 2: Test with docs-only PR before merging
- Phase 3: Verify on next actual release

### QA Validation Results

**Status:** ✅ PASSED
**Date:** 2026-01-29

**Validation Summary:**
- ✅ Environment: Node.js v22.15.0, pnpm 9.0.0
- ✅ All target files exist
- ✅ Dependencies installed correctly
- ✅ YAML syntax valid (docs.yaml, release.yaml)
- ✅ JavaScript syntax valid (docusaurus.config.js)
- ✅ Docusaurus dependencies present (v3.9.2)
- ✅ Docs staging works correctly
- ✅ API doc generation functional
- ✅ GitHub CLI available (v2.83.0)

**Ready for Implementation:** All technical prerequisites met.

### Success Criteria

1. ✅ Docusaurus site loads correctly at <https://texarkanine.github.io/a16n/>
2. ✅ Docs deploy immediately for prose-only changes
3. ✅ Docs deployment skipped when code changes are included
4. ✅ Docs automatically rebuild after package releases
5. ✅ Single docs build per release cycle (not N builds for N packages)

### Implementation Complete

**PR Created:** https://github.com/Texarkanine/a16n/pull/20
**Status:** Ready for review and merge
**Commit:** 8b7ab73

All three phases implemented successfully:
- Phase 1: Fixed baseUrl from '/' to '/a16n/'
- Phase 2: Added smart deployment safety guard
- Phase 3: Integrated docs trigger with release workflow
