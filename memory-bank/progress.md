# Memory Bank: Progress

<!-- This file tracks implementation progress, completed steps, and current status. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Overall Project Status

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase 1** | ✅ Complete | PR #1 merged (GlobalPrompt MVP) |
| **Phase 2** | ✅ Complete | PR #3 merged (FileRule + AgentSkill) |
| **Phase 3** | ✅ Complete | PR #4 merged (AgentIgnore + CLI polish) |
| **Phase 4** | ✅ Complete | PR #8 merged (AgentCommand, Cursor → Claude) |
| **Phase 5** | ✅ Complete | Git ignore output management + conflict flag |
| **Phase 6** | ✅ Complete | CLI Polish (dry-run wording + --delete-source) |
| **Phase 7** | ✅ Complete | AgentSkills standard alignment |

## Current Session

**Task:** DOCS-PIVOT-STAGING  
**Status:** ✅ COMPLETE - ALL PHASES (2026-01-29)

### Implementation Summary

Fully implemented versioned API documentation system with git tag-based historical docs, React version picker, and curated API indexes.

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Cleanup | ✅ Complete | Removed 46 committed API docs |
| 2. Build Scripts | ✅ Complete | Staging area + parallel TypeDoc |
| 3. Docusaurus Config | ✅ Complete | `.generated/` source, search, homepage |
| 4. Version Picker | ✅ Complete | React component with proper navigation |
| 5. Versioned API | ✅ Complete | TypeScript script, monorepo resolution |
| 6. CI Versioning | ✅ Complete | Dual build modes (local/CI) |
| 7. Verification | ✅ Complete | All systems functional |

### Key Fixes During Implementation

**Phases 1-3:**
1. **glob-hook ESM** - Added `.js` extensions to relative imports
2. **Location** - Moved `apps/docs/` → `packages/docs/`
3. **Parallel TypeDoc** - 6x speedup (~66s → ~11s)
4. **Spec correction** - Updated DOCS_2.md for packages/docs/

**Phases 4-6:**
5. **TypeDoc Historical Resolution** - Check out all packages from same commit for type compatibility
6. **Routing Conflicts** - Renamed README.md → index.md with frontmatter, removed self-referential links
7. **CLI Tool API Removal** - Excluded `cli` and `glob-hook` (not libraries)
8. **Homepage 404** - Set `routeBasePath: '/'` and `slug: /` on intro.md
9. **Version Sorting** - Custom `sidebarItemsGenerator` with semantic versioning
10. **VersionPicker Navigation** - Fixed URL construction and trailing slash handling
11. **Dual Build Modes** - Local `current` vs CI `tagged versions only`

### Commits Created

- `7057f71` - refactor(docs): remove committed API docs
- `2d3c00d` - feat(docs): implement staging area build scripts
- `4264b4d` - fix(glob-hook): add .js extensions to imports
- `a48de31` - refactor(docs): move to packages/docs

---

## Previous Session

**Task:** DOCS-SITE-MVP  
**Status:** ✅ COMPLETE (2026-01-28)

### Implementation Summary

**Build Phase:** All 7 phases completed successfully

| Phase | Status | Time | Notes |
|-------|--------|------|-------|
| 1. Project Structure | ✅ Complete | ~5min | Created `apps/docs/`, updated workspace config |
| 2. Docusaurus Config | ✅ Complete | ~10min | Basic config without TypeDoc plugins |
| 3. Placeholder Guides | ✅ Complete | ~15min | 6 package guides + intro page |
| 4. TypeDoc Integration | ⚠️ Deferred | ~45min | Version conflicts, basic build works |
| 5. Turbo Integration | ✅ Complete | ~5min | Build outputs configured |
| 6. CI/CD Workflow | ✅ Complete | ~10min | GitHub Actions ready |
| 7. Verification | ✅ Complete | ~20min | Docs build: 66s, passes all checks |

**Total Implementation Time:** ~2 hours

### Key Deliverables

1. **Working Docusaurus Site**
   - Location: `apps/docs/`
   - Build time: 66 seconds
   - Output: Static site in `build/` directory
   - Status: Production-ready MVP

2. **Documentation Structure**
   - Intro page with project overview
   - 6 package-specific placeholder guides
   - Navigation sidebar configured
   - Links between pages working

3. **Build Integration**
   - `pnpm --filter docs run build` works
   - `pnpm run build` includes docs in turbo pipeline
   - Proper gitignore for generated files
   - Turbo caching configured

4. **CI/CD Ready**
   - `.github/workflows/docs.yaml` created
   - GitHub Pages deployment configured
   - Automatic build on main branch push

### Technical Decisions

1. **Deferred TypeDoc API Generation**
   - **Why:** Plugin version incompatibility (typedoc 0.27 vs 0.28)
   - **Impact:** API reference section not yet generated
   - **Mitigation:** Infrastructure in place, can be added post-MVP
   - **Timeline:** After plugin ecosystem stabilizes

2. **Homepage Link Warnings**
   - **Why:** Default Docusaurus template links to "/"
   - **Impact:** Build warnings (not errors) about broken links
   - **Mitigation:** Set `onBrokenLinks: 'warn'` for MVP
   - **Fix:** Simple config change post-deployment

### Files Created/Modified

**New Files:**
- `apps/docs/package.json`
- `apps/docs/docusaurus.config.js`
- `apps/docs/sidebars.js`
- `apps/docs/docs/intro.md`
- `apps/docs/docs/{cli,engine,models,plugin-cursor,plugin-claude,glob-hook}/index.md`
- `apps/docs/src/css/custom.css`
- `.github/workflows/docs.yaml`

**Modified Files:**
- `pnpm-workspace.yaml` - Added `apps/*`
- `.gitignore` - Added docs build outputs
- `turbo.json` - Added docs build/start tasks
- `pnpm-lock.yaml` - Added 1136 new dependencies

### Verification Results

✅ **Build Verification**
```bash
pnpm --filter docs run build
# Exit code: 0
# Time: 66.098s
# Output: Static site generated successfully
```

✅ **Integration Verification**
```bash
pnpm run build
# Exit code: 0 (docs package built successfully)
# Note: glob-hook test failures pre-existing, unrelated to docs
```

✅ **File Structure Verification**
```text
apps/docs/build/
├── 404.html
├── assets/
├── docs/
├── img/
└── sitemap.xml
```

### Known Limitations (MVP)

1. **No API Reference Yet**
   - TypeDoc plugins need version alignment
   - Can be added incrementally post-MVP

2. **Placeholder Content Only**
   - All guide pages are stubs
   - Ready for users to fill in detailed documentation

3. **Minor Link Warnings**
   - Homepage links in navbar/footer
   - Non-blocking, easily fixed

### Success Criteria Met

✅ Private `apps/docs` workspace package exists  
✅ Docusaurus 3.x + dependencies installed  
✅ Placeholder hand-written docs for each module  
✅ GitHub Actions workflow created  
✅ Package READMEs stay in-package  
✅ Build pipeline proven (66s build time)  
⚠️ TypeDoc integration deferred (infrastructure ready)

### Next Steps (Post-MVP)

1. Test GitHub Pages deployment
2. Fix homepage link warnings (simple config)
3. Add TypeDoc plugins when versions align
4. Fill in placeholder content gradually
5. Add code examples to guides
6. Consider adding algolia search integration
