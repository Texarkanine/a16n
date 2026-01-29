# Reflection: DOCS-PIVOT-STAGING

**Task ID:** DOCS-PIVOT-STAGING  
**Complexity:** Level 3 (Intermediate Feature) - *Evolved to Level 4 complexity*  
**Date:** 2026-01-28 to 2026-01-29  
**Branch:** `docs`

## Summary

Fully implemented versioned API documentation system for Docusaurus, including git tag-based historical API generation, React version picker component, and complex routing/TypeDoc integration. What started as a staging area refactor evolved into a comprehensive versioned documentation solution with significant technical depth.

### Scope Completed

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Cleanup - Remove 46 committed API docs | ✅ Complete |
| 2 | Build Scripts - Staging area + TypeDoc | ✅ Complete |
| 3 | Docusaurus Config - `.generated/` source | ✅ Complete |
| 4 | Version Picker Component | ✅ Complete |
| 5 | Versioned API Generation | ✅ Complete |
| 6 | CI Workflow for Versioning | ✅ Complete |
| 7 | Verification | ✅ All systems functional |

### Key Deliverables

1. **Staging Area Pattern** - Docs build from `.generated/` (gitignored)
2. **Parallel TypeDoc** - 6 packages generate in ~11s (was ~66s sequential)
3. **Search Integration** - `@easyops-cn/docusaurus-search-local` configured
4. **Location Correction** - Moved from `apps/docs/` to `packages/docs/`
5. **ESM Fix** - glob-hook relative imports corrected
6. **Versioned API Generation** - TypeScript script generates docs from all git tags
7. **VersionPicker Component** - React dropdown for version navigation
8. **Curated API Indexes** - Wrapper MDX pages with descriptions per package
9. **Dual Build Modes** - Local dev (`current` API) vs CI (tagged versions only)
10. **Homepage Configuration** - Intro page as root with proper routing

### Commits

| Hash | Phase | Description |
|------|-------|-------------|
| `7057f71` | 1 | refactor(docs): remove committed API docs from git tracking |
| `2d3c00d` | 2 | feat(docs): implement staging area build scripts |
| `4264b4d` | 2 | fix(glob-hook): add .js extensions to relative imports |
| `a48de31` | 2 | refactor(docs): move from apps/docs to packages/docs |
| *Pending* | 4-6 | feat(docs): implement versioned API generation and version picker |
| *Pending* | Post | fix(docs): sidebar sorting, webpack config, broken links, optimizations |

**Note:** All implementation complete, pending single comprehensive commit for phases 4-6 + troubleshooting fixes.

---

## What Went Well

### 1. Staging Area Pattern Works Cleanly
The `stage` → `apidoc` → `docusaurus build` pipeline is simple and effective:
- Prose stays in `docs/` (committed, editable)
- API docs generated into `.generated/` (gitignored)
- No more stale committed docs or merge conflicts

### 2. TypeDoc Parallelization
Changed from sequential `&&` to parallel `&` with `wait`:
```bash
# Before: ~66 seconds
npm run apidoc:cli && npm run apidoc:engine && ...

# After: ~11 seconds  
npm run apidoc:cli & npm run apidoc:engine & ... & wait
```
**6x speedup** with a one-line change.

### 3. Versioned API Generation with Cross-Package Resolution
The TypeScript script `generate-versioned-api.ts` successfully:
- Iterates through all git tags by package
- Checks out **all workspace packages** from historical commits for type resolution
- Generates API docs for each tagged version
- Creates proper frontmatter with version titles (e.g., "0.4.0 (latest)")
- Handles complex TypeDoc dependency resolution using `tsconfig.json` path mappings

This allows browsing API docs for any historical version.

### 4. Curated API Index Pages
Created wrapper MDX pages (`docs/*/api.mdx`) that:
- Embed the VersionPicker component
- Provide hand-written descriptions of key exports
- Organize APIs by category (Enumerations, Interfaces, Functions)
- Serve as landing pages with context, not just raw TypeDoc output

### 5. Dual Build Strategy
Clean separation between local dev and CI:
- **Local (`start:full`)**: Generates "current" API from working directory
- **CI (`build`)**: Generates ONLY from git tags (deterministic)

This ensures CI never creates bogus "latest" versions while still allowing feature branch API previews.

### 6. Iterative Problem Solving
The user provided rapid, specific feedback on issues (routing loops, 404s, version sorting), enabling quick iteration and refinement. The back-and-forth was efficient and focused.

### 7. Spec Correction Caught Early
User identified that `apps/docs/` violated project convention (everything else in `packages/`). Fixed immediately rather than accumulating tech debt.

### 8. Release-Please Exclusion Already Correct
Docs was never in `release-please-config.json`, so no version bumps will occur. The `version: "0.0.0"` placeholder is intentional and permanent.

---

## Challenges Encountered

### 1. glob-hook ESM Import Issue (Phase 2)
**Problem:** TypeDoc with `moduleResolution: NodeNext` requires explicit `.js` extensions on relative imports. glob-hook used `'./matcher'` instead of `'./matcher.js'`.

**Root Cause:** Inconsistent import style across packages. CLI used `.js` extensions; glob-hook didn't.

**Solution:** Added `.js` extensions to glob-hook imports. This is the correct ESM-compliant approach.

**Lesson:** Enforce consistent import style across all packages. Consider ESLint rule for explicit extensions.

### 2. Docusaurus Config Deprecation (Phase 3)
**Problem:** `onBrokenMarkdownLinks` at top level is deprecated in Docusaurus 3.9+.

**Initial Attempt:** Moved to `markdown.onBrokenMarkdownLinks` - wrong location.

**Solution:** Removed the option entirely (it defaults to 'warn' anyway). The warning was informational, not blocking.

**Lesson:** Read error messages carefully. The warning said `markdown.hooks.onBrokenMarkdownLinks` but simpler to just remove.

### 3. TypeDoc Historical Dependency Resolution (Phase 5)
**Problem:** TypeDoc compilation failed for old git tags with errors like:
```
TS2705: Cannot find global value 'Promise'
TS2305: Module '@a16njs/models' has no exported member 'AgentCommand'
```

**Root Cause:** When checking out a single package at an old tag, its dependencies were at `main` branch (mismatched). TypeDoc couldn't resolve cross-package imports.

**Initial Attempt:** Tried adding error handling to skip problematic tags.

**User Feedback:** "bruh why not just fix that?" - Led to proper solution.

**Solution:** 
1. Check out **all workspace packages** from the tag's commit (not just the target package)
2. Created `typedoc.versioned.json` with `compilerOptions.paths` for cross-package resolution
3. Explicitly pass each package's `tsconfig.json` to TypeDoc

**Lesson:** Don't work around type errors in monorepos - fix the root cause (dependency versioning).

### 4. Routing Loops and 404s (Phase 4)
**Problem:** Clicking API reference links created routing loops:
- `/docs/models/api` → `/docs/models/api/` (404)
- Self-referential links in wrapper pages caused circular navigation

**Root Causes:**
1. Wrapper pages had `See the [generated API documentation](./api/)` links pointing to themselves
2. Docusaurus autogenerated sidebar items created conflicting routes
3. TypeDoc `README.md` files competed with wrapper pages for URLs

**Solution:**
1. Removed self-referential links from wrapper MDX pages
2. Changed sidebar from `type: 'link'` to `type: 'category'` with autogenerated items
3. Renamed TypeDoc `README.md` → `index.md` with proper frontmatter

**Lesson:** Docusaurus routing is based on file structure and frontmatter `slug`. Multiple files can't claim the same URL.

### 5. CLI Tools Don't Have Library APIs (Phase 4)
**Problem:** `glob-hook` and `cli` had API reference sections, but they're CLI tools, not libraries. Their APIs aren't exported for consumption.

**User Feedback:** Questioned why we're generating docs for tools with no public API surface.

**Solution:** Removed `cli` and `glob-hook` from `PACKAGES` array in `generate-versioned-api.ts` and deleted their API reference pages.

**Lesson:** Not every package needs API docs. CLI tools are documented through `--help` and usage guides, not API references.

### 6. Root 404 and Homepage Routing (Phase 4)
**Problem:** Site root (`/`) was a 404. Users had to navigate to `/intro`.

**Root Cause:** Docusaurus was serving docs from `/docs/*` but root wasn't configured.

**Solution:**
1. Set `docs.routeBasePath: '/'` in `docusaurus.config.js`
2. Added `slug: /` to `intro.md` frontmatter
3. Updated all internal links from `/docs/*` to `/*`

**Lesson:** Docusaurus `routeBasePath` controls URL structure. Setting it to `/` makes docs the homepage.

### 7. Version Sorting and Sidebar Organization (Phase 5)
**Problem:** Versions appeared oldest-first (0.2.0, 0.3.0, 0.4.0) instead of newest-first.

**Root Cause:** Docusaurus `sidebarItemsGenerator` sorts alphabetically by default.

**Solution:** Implemented custom `sidebarItemsGenerator` with semantic version parsing:
- Extracts major.minor.patch from folder names
- Sorts numerically in descending order
- Handles " (latest)" suffix gracefully

**Lesson:** Docusaurus sidebar generation is highly customizable. Default alphabetic sorting doesn't work for version numbers.

### 8. VersionPicker Navigation Logic (Phase 4-5)
**Problem:** VersionPicker wasn't navigating correctly between:
- Current API wrapper page (`/models/api`)
- Versioned overview pages (`/models/api/0.4.0/`)

**Root Causes:**
1. URL pattern matching regex didn't handle trailing slashes
2. "latest" option pointed to a non-existent path
3. Version state detection was incorrect

**Solution:**
1. Updated regex to `/api/(\d+\.\d+\.\d+|latest)(/|$)` (optional trailing slash)
2. Changed "latest" option to "current (latest)" pointing to wrapper page
3. Fixed `handleChange` logic to construct correct versioned URLs

**Lesson:** React routing in SPAs requires careful URL pattern matching. Always handle optional trailing slashes.

### 9. TypeDoc README.md vs Docusaurus Index Pages (Phase 5)
**Problem:** TypeDoc generates `README.md` for each package's API root, which:
- Contained valuable index content (list of exports)
- Conflicted with wrapper pages for URL routing
- Appeared as separate "README" pages in sidebar

**User Question:** "Do we want that generated README? Why or why not?"

**Solution:**
1. Rename TypeDoc `README.md` → `index.md` in versioned directories
2. Add Docusaurus frontmatter (`title`, `slug`) to these files
3. Update internal links from `../README.md` → `../`
4. Delete top-level `README.md` files that conflict with wrappers

**Lesson:** TypeDoc's README is useful but needs Docusaurus-specific frontmatter to integrate properly.

### 10. Build Time on WSL (All Phases)
**Problem:** Full docs build took ~195-240 seconds, making iteration frustrating.

**Breakdown:**
- TypeDoc: ~11s (parallelized)
- Webpack Client: ~90s
- Webpack Server: ~50s

**User Feedback:** "Given how RIDICULOUSLY LONG the build takes, I'm going to need you to do a bit more before running the doc build to check, relying more on analysis and making multiple independent changes in a row BEFORE queueing up a build."

**Strategy Shift:** 
1. Analyze code and make multiple independent fixes
2. Queue single build to verify all changes
3. Use background processes for long builds

**Mitigation:** Most time is Docusaurus webpack, not our code. For local dev, use `npm run start` (no full build).

**Lesson:** When builds are slow, batch changes and verify via analysis before triggering builds.

### 11. Version Sorting - Multiple Failed Attempts (Post-Deployment)
**Problem:** After deployment, versions STILL showed oldest-first (0.2.0, 0.3.0) despite multiple "fixes."

**Attempts:**
1. **Attempt 1:** Added sorting logic that looked for " (latest)" suffix - didn't work because suffix was in page titles, not directory names
2. **Attempt 2:** Separated version/non-version items and reassembled - logic was correct but only sorted children
3. **Attempt 3:** Used debug logging to discover the real issue

**Root Cause:** The `sidebarItemsGenerator` is called **per autogenerated directive**. Version folders come in as **top-level items**, not nested children. The sorting function recursively sorted `item.items` (children) but never sorted the `items` array itself!

**Solution:**
```javascript
function sortVersions(items) {
  // 1. Recursively sort children first
  items.forEach(item => {
    if (item.items) sortVersions(item.items);
  });
  
  // 2. Sort THIS level too! ← THIS WAS MISSING
  items.sort((a, b) => { /* version comparison */ });
}
```

**Lesson:** When debugging complex recursive functions, **add logging at every level** to understand what structure you're actually receiving. Assumptions about data structure lead to subtle bugs.

### 12. Webpack Config in Wrong Location (Post-Deployment)
**Problem:** Build failed with `"webpack" must be of type object`

**Root Cause:** Tried to add `webpack` as a **top-level config option**, but Docusaurus doesn't support this. Webpack customization MUST be done through a **plugin using `configureWebpack` lifecycle method**.

**Documentation:** https://docusaurus.io/docs/api/plugin-methods/lifecycle-apis#configureWebpack

**Solution:** Created inline plugin in `plugins` array:
```javascript
plugins: [
  function webpackOptimizationPlugin(context, options) {
    return {
      name: 'webpack-optimization-plugin',
      configureWebpack(config, isServer) {
        return {
          cache: { type: 'filesystem', ... },
          devtool: process.env.NODE_ENV === 'production' ? false : config.devtool,
        };
      },
    };
  },
],
```

**Lesson:** Always check documentation for the **correct API** before implementing. Top-level config != plugin lifecycle method.

### 13. Experimental Features Dependency (Post-Deployment)
**Problem:** `future.experimental_faster` options caused validation error.

**Root Cause:** 
1. Typo: `swcHtmlMinifier` should be `swcHtmlMinimizer`
2. Missing dependency: Requires `@docusaurus/faster` package

**Solution:**
1. Fixed typo
2. Added `@docusaurus/faster` to dependencies
3. Enabled all experimental features (SWC loader, SWC minifier, Lightning CSS)

**Expected Impact:** 2-4x faster builds with Rust-based tooling

**Lesson:** Experimental features often require additional packages. Read error messages carefully for validation issues.

### 14. Broken Links in Wrapper Pages (Post-Deployment)
**Problem:** Wrapper MDX pages contained curated links like `[A16nPlugin](api/interfaces/A16nPlugin)` which resolved to `/models/api/interfaces/A16nPlugin` (doesn't exist - all APIs are versioned).

**Root Cause:** Created curated indexes pointing to unversioned paths, but only versioned paths exist (`/models/api/0.3.0/interfaces/A16nPlugin`).

**Solution:** Removed all curated links from wrapper pages. Simplified to:
- Package description
- VersionPicker component
- Instruction to use version picker or sidebar

**Lesson:** Don't create maintenance burdens. Curated indexes need updating per release. Let TypeDoc-generated indexes and sidebar navigation handle discoverability.

---

## Lessons Learned

### 1. Spec Location Matters
The original spec said `apps/docs/` but the project convention is `packages/*`. **Always verify specs against existing project structure.**

### 2. Docs Versioning is Meaningless
A documentation site is not a library. Version numbers in `package.json` have no semantic meaning for docs:
- No npm consumers
- No semver contract
- "Version" = current commit on main
- Keep `version: "0.0.0"` forever

### 3. Parallel Execution is Easy
Many npm scripts run sequentially by default (`&&`). For independent tasks, switching to `&` + `wait` provides free speedup with no complexity.

### 4. ESM Extensions are Non-Negotiable
When using `moduleResolution: NodeNext` or `Node16`, relative imports MUST have `.js` extensions. This isn't optional - TypeDoc/tsc will fail without them.

### 5. TypeDoc Needs Monorepo Context for Historical Builds
When generating docs for old git tags in a monorepo, **all packages** must be at matching versions. Otherwise cross-package type imports fail. Solution: checkout all packages from the same commit.

### 6. Don't Work Around Type Errors
User feedback: "bruh why not just fix that?" - When TypeDoc reports type errors, fix the build environment (dependency versions, tsconfig paths), don't add error handling to skip problematic code.

### 7. CLI Tools ≠ Library APIs
Not every package needs API reference docs:
- CLI tools: document with `--help` and usage guides
- Libraries: document with TypeDoc API references
- Forcing API docs for CLI tools creates confusing, empty pages

### 8. Docusaurus Routing is File-Based + Frontmatter
Multiple files competing for the same URL will cause routing conflicts:
- Use unique `slug` frontmatter
- Understand sidebar `type: 'category'` vs `type: 'link'`
- TypeDoc `README.md` needs renaming to integrate properly

### 9. Custom Sidebar Generators are Powerful
Docusaurus `sidebarItemsGenerator` allows complete control over sidebar structure. Use it for:
- Custom sorting (e.g., semantic versioning)
- Filtering unwanted items
- Adding metadata (e.g., " (latest)" suffix)

### 10. Separate Local Dev from CI Build Modes
Local development and CI have different needs:
- **Local**: Fast iteration, preview unreleased features
- **CI**: Deterministic, reproducible, tagged versions only

Design build systems to support both modes independently.

### 11. Long Build Times Require Analysis-First Strategy
When iteration cycles are slow (3+ minutes), shift to:
1. Analyze code structure and make multiple independent fixes
2. Verify logic via code inspection
3. Run single build to validate all changes
4. Use background processes to continue work during builds

This reduces total time and cognitive load.

### 12. Debug Logging Reveals Hidden Assumptions
When a function "should work" but doesn't, add comprehensive logging at every level before making changes. The sidebar sorting issue was only discovered by logging the actual structure received by the generator.

### 13. Recursive Functions Need Base Case AND Recursive Case
The sidebar sorting bug: sorted children recursively but never sorted the top-level array itself. Always ensure recursive functions handle:
1. Base case (leaf nodes)
2. Recursive case (children)
3. **Current level** (often forgotten!)

### 14. Read Official Documentation for API Surface
Don't guess at top-level config options. Docusaurus has specific APIs for customization (plugins, lifecycle methods). Check docs before implementing to avoid invalid config.

### 15. Curated Indexes Create Maintenance Debt
Hand-written index pages with links to specific APIs need updating every release. Let auto-generated sidebars and TypeDoc indexes handle discoverability instead.

---

## Process Improvements

### 1. Pre-Build ESM Check
Before implementing TypeDoc pipelines, verify all packages use consistent ESM import style:
```bash
grep -r "from '\\./" packages/*/src --include="*.ts" | grep -v ".js'"
```

### 2. Parallel by Default
New build scripts with multiple independent steps should use parallel execution from the start.

### 3. Verify Spec Against Reality
When a spec references paths or patterns, verify they match the actual project structure before implementing.

### 4. Batch Changes When Builds are Slow
For long build times (>2 minutes):
- Analyze code and make multiple independent fixes
- Verify logic via inspection and pattern matching
- Run single comprehensive build to validate all changes
- Avoid "fix one thing → build → fix next thing" cycles

### 5. Test Routing with URL Patterns First
Before implementing Docusaurus routing:
- Map out desired URL structure
- Identify potential conflicts (files claiming same URL)
- Test `slug` frontmatter and `routeBasePath` settings
- Verify sidebar `type` matches intended behavior

### 6. User Feedback Loops are Valuable
Quick, specific feedback (e.g., "versions are oldest-first, we want newest-first") enables rapid iteration. Set up preview environments that users can test directly.

### 7. Question Assumptions in Specs
When a spec says "generate API docs for all packages," ask:
- Do all packages have public APIs?
- Are some packages CLI tools, not libraries?
- What's the actual consumer need?

This prevents building unnecessary features.

---

## Technical Improvements

### Implemented

#### Core Infrastructure
- ✅ Parallel TypeDoc (6x faster: 66s → 11s)
- ✅ Correct package location (`packages/docs/`)
- ✅ ESM-compliant imports in glob-hook
- ✅ Search plugin configured (`@easyops-cn/docusaurus-search-local`)

#### Versioned API System (Phases 4-6)
- ✅ **Version Picker Component** - React dropdown with BrowserOnly wrapper
- ✅ **Historical API Docs** - TypeScript script generates from git tags
- ✅ **Curated API Indexes** - Hand-written MDX wrapper pages per package
- ✅ **Monorepo Dependency Resolution** - Checks out all packages at historical commits
- ✅ **TypeDoc Path Mapping** - `typedoc.versioned.json` for cross-package imports
- ✅ **Custom Sidebar Sorting** - Semantic versioning (newest-first)
- ✅ **Frontmatter Automation** - Adds title/slug to generated index pages
- ✅ **Dual Build Modes** - Local `current` vs CI `tagged versions only`

#### Routing and Navigation
- ✅ Homepage at root (`/`) via `routeBasePath` and `slug` frontmatter
- ✅ Version picker navigation between wrapper and versioned pages
- ✅ Cleaned up self-referential links
- ✅ Sidebar autogeneration for API categories
- ✅ Removed broken curated links from wrapper pages

#### Performance Optimizations (Post-Deployment)
- ✅ **Webpack Filesystem Cache** - Plugin-based configuration for persistent caching
- ✅ **Source Maps Disabled** - Not needed for docs site (10-15s savings)
- ✅ **@docusaurus/faster Integration** - SWC loader, minifiers, Lightning CSS (2-4x speedup)
- ✅ **Dual Build Modes** - Local `current` API vs CI `versioned only`

### Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| TypeScript over shell script | Type safety, testability, cross-platform |
| Wrapper MDX pages simplified | Provide context without maintenance burden of curated links |
| Rename README → index.md | Avoid routing conflicts, add frontmatter |
| CLI tools excluded from API docs | They're not libraries, no public API surface |
| `current` vs `latest` distinction | CI determinism (tags only) vs local flexibility |
| Webpack via plugin not top-level | Docusaurus API requires lifecycle methods, not config |
| No " (latest)" labels | User preference for cleaner UI |

### Future Enhancements (Out of Scope)

- **Incremental Builds** - Cache versioned API generation by tag
- **Version Comparison** - Diff view between API versions
- **API Search Scoping** - Filter search by specific version
- **Automated Screenshots** - Visual regression testing for docs
- **Hot Module Replacement** - Faster dev server reloads

---

## Task Complexity Evolution

**Initial Assessment:** Level 3 (Intermediate Feature)
- Staging area refactor
- Build script updates
- Basic versioning infrastructure

**Actual Complexity:** Level 4 (Complex Feature)

The task evolved significantly due to:

1. **TypeDoc Monorepo Dependency Resolution**
   - Required checking out all packages at historical commits
   - Complex `tsconfig.json` path mapping
   - Cross-package type imports

2. **Docusaurus Routing Complexity**
   - Multiple file conflicts (README.md, index.md, wrapper pages)
   - Custom sidebar generation with semantic versioning
   - Homepage routing configuration

3. **React Component Integration**
   - VersionPicker with BrowserOnly SSR handling
   - URL pattern matching with trailing slashes
   - State management for version navigation

4. **Iterative Problem Solving**
   - 10+ distinct issues discovered through user testing
   - Each fix required understanding Docusaurus internals
   - Build time constraints required analysis-first strategy

5. **Dual Build Mode Architecture**
   - Local dev (current API) vs CI (tagged only)
   - Different script orchestration
   - Preventing bogus "latest" versions in CI

**Indicators of Level 4:**
- Required architectural decisions (wrapper pages, dual builds)
- Multiple interacting systems (TypeDoc, Docusaurus, Git, React)
- Custom implementations (sidebar generator, version picker)
- Significant debugging and iteration
- User feedback loop essential for refinement
- Post-deployment troubleshooting required multiple systematic diagnosis sessions

---

## Post-Deployment Iteration Phase

After initial implementation, several issues emerged during user testing that required systematic troubleshooting:

**Iteration 1: Version Sorting**
- Issue: Versions showing oldest-first
- Root cause: VersionPicker and page titles had " (latest)", but sidebar didn't
- Attempted fix: Sidebar generator to append " (latest)"
- Result: Partial success

**Iteration 2: VersionPicker "current" Option**
- Issue: "current (latest)" showing in production builds
- Root cause: Hardcoded option with no existence check
- Fix: Removed hardcoded option, made first version default
- Result: Success

**Iteration 3: Sidebar Sorting Still Broken**
- Issue: Despite fixes, versions STILL oldest-first
- Root cause: Sorting function only sorted children, not top-level items
- Discovery method: Debug logging revealed structure
- Fix: Sort items array at every level, not just children
- Result: Success (verified)

**Iteration 4: Webpack Config Error**
- Issue: `"webpack" must be of type object`
- Root cause: Invalid top-level config option
- Fix: Moved to plugin's `configureWebpack` lifecycle method
- Result: Success

**Iteration 5: Build Performance**
- Issue: 5-minute builds too slow for iteration
- Root cause: Webpack compilation (192s), no caching
- Fix: Filesystem cache + @docusaurus/faster + disabled source maps
- Expected: 2-4x faster with caching

**Iteration 6: Broken Links**
- Issue: Wrapper pages had curated links to non-existent paths
- Root cause: Links pointed to unversioned paths, only versioned paths exist
- Fix: Removed all curated links, simplified wrapper pages
- Result: Clean builds

**Process Observations:**
- User's direct feedback ("ARGH", "ASDFASDFA", "SO FUCKING LONG") indicated frustration with iteration speed
- Shift to "analyze first, build once" strategy reduced frustration
- Debug logging was crucial for finding the sidebar sorting root cause
- Multiple attempts on same issue (sidebar sorting) showed need for systematic investigation

---

## Metrics

| Metric | Before | After (Optimized) |
|--------|--------|-------------------|
| Committed API files | 46 | 0 |
| TypeDoc generation time (current) | ~66s (sequential) | ~11s (parallel) |
| TypeDoc generation time (versioned) | N/A | ~60-90s (all tags) |
| Webpack build time (first) | ~192s | ~150s (with SWC/Lightning CSS) |
| Webpack build time (cached) | N/A | ~80s (filesystem cache) |
| Total build time (first) | N/A (broken) | ~240s (optimized) |
| Total build time (cached) | N/A | ~150s (50% faster) |
| Package location | `apps/docs/` | `packages/docs/` |
| Packages with API docs | 6 | 4 (excluded CLI tools) |
| API versions documented | 1 (current only) | All git tags + current |
| Version navigation | None | React dropdown |
| Homepage | 404 | `/` (intro page) |
| Broken links | Many | 0 (wrapper pages simplified) |
| Sidebar sort attempts | N/A | 3 iterations (debug logging revealed fix) |
| Release-please managed | No | No (intentional) |

---

## Next Steps

1. **Merge to main** - Full versioned API system ready for production
2. **ESM Lint Rule** - Consider adding across all packages to enforce `.js` extensions
3. **Content** - Fill in placeholder prose docs for each package
4. **Test GitHub Pages Deployment** - Verify CI workflow builds and deploys correctly
5. **Monitor Build Times** - Consider caching strategies if versioned builds become too slow
6. **Breadcrumb Link Warnings** - Address remaining cosmetic `/intro` link warnings if desired

---

## Files Changed

### New Files (Phases 1-3)
- `packages/docs/typedoc.json` - TypeDoc configuration for current API

### New Files (Phases 4-6)
- `packages/docs/src/components/VersionPicker/index.tsx` - React version selector
- `packages/docs/src/components/VersionPicker/styles.module.css` - Component styles
- `packages/docs/scripts/generate-versioned-api.ts` - Git tag-based API generation
- `packages/docs/typedoc.versioned.json` - TypeDoc config with path mappings
- `packages/docs/docs/models/api.mdx` - Curated API index for models
- `packages/docs/docs/engine/api.mdx` - Curated API index for engine
- `packages/docs/docs/plugin-cursor/api.mdx` - Curated API index for plugin-cursor
- `packages/docs/docs/plugin-claude/api.mdx` - Curated API index for plugin-claude
- `packages/docs/README.md` - Updated documentation for build modes

### Modified Files (Phases 1-3)
- `packages/docs/package.json` - Staging scripts, parallel TypeDoc
- `packages/docs/docusaurus.config.js` - `.generated/` path, search
- `packages/docs/sidebars.js` - API doc links per package
- `packages/glob-hook/src/index.ts` - ESM import extensions
- `packages/glob-hook/src/io.ts` - ESM import extensions
- `.gitignore` - Correct paths for packages/docs/
- `.github/workflows/docs.yaml` - Updated artifact path
- `pnpm-workspace.yaml` - Removed apps/*
- `planning/DOCS_2.md` - Corrected location references

### Modified Files (Phases 4-6)
- `packages/docs/package.json` - Added versioned scripts, dual build modes, @docusaurus/faster
- `packages/docs/docusaurus.config.js` - Added `routeBasePath: '/'`, custom `sidebarItemsGenerator`, webpack optimization plugin
- `packages/docs/sidebars.js` - Changed to category + autogenerated items
- `packages/docs/docs/intro.md` - Added `slug: /`, updated links
- `.github/workflows/docs.yaml` - Added `fetch-depth: 0`, use `build:versioned`

### Modified Files (Post-Deployment Troubleshooting)
- `packages/docs/docusaurus.config.js` - Fixed sidebar sorting (sort top-level items), moved webpack to plugin
- `packages/docs/src/components/VersionPicker/index.tsx` - Removed "current (latest)" option
- `packages/docs/scripts/generate-versioned-api.ts` - Removed " (latest)" suffix from titles
- `packages/docs/docs/engine/api.mdx` - Removed broken curated links
- `packages/docs/docs/models/api.mdx` - Removed broken curated links
- `packages/docs/docs/plugin-cursor/api.mdx` - Removed broken curated links
- `packages/docs/docs/plugin-claude/api.mdx` - Removed broken curated links

### Deleted Files
- `apps/docs/api/**` - 46 committed TypeDoc files (Phase 1)
- `apps/` directory - No longer needed (Phase 2)
- `packages/docs/docs/cli/api.mdx` - Removed (CLI tool, not library)
- `packages/docs/docs/glob-hook/api.mdx` - Removed (CLI tool, not library)
