# TASK ARCHIVE: Codecov Integration for Monorepo

## METADATA

- **Task ID**: CODECOV-MONOREPO
- **Type**: Enhancement (Level 2)
- **Created**: 2026-02-03
- **Completed**: 2026-02-03
- **PR**: https://github.com/Texarkanine/a16n/pull/31 (Draft)
- **Commit**: `9823020` - feat: add Codecov coverage tracking with per-package flags

---

## SUMMARY

Integrated Codecov coverage tracking across all 7 packages in the a16n monorepo using Codecov's Flags feature. Each package uploads coverage separately with its own flag, enabling per-package coverage badges, PR status checks, and granular coverage metrics. Implementation includes vitest coverage configuration, CI workflow updates, and badge additions to all package READMEs.

**Outcome**: Monorepo now has comprehensive code coverage tracking with per-package visibility and carryforward support.

---

## REQUIREMENTS

### Objective
Add Codecov coverage tracking to all packages in the a16n monorepo with **distinct coverage badges per package**.

### Key Requirements
1. Each package must have its own coverage badge
2. Coverage should be tracked per-package (not monorepo-wide)
3. Unchanged packages should preserve their coverage data (carryforward)
4. All existing tests must continue to pass with coverage enabled
5. CI workflow must upload coverage automatically

### Architecture Decision
**Codecov Flags** - Selected for per-package coverage tracking because:
- Enables per-package coverage percentages
- Allows per-package badges via `?flag=<flag-name>` parameter
- Supports per-package status checks in PRs
- Provides carryforward support for unchanged packages

### Configuration Decisions
- **Thresholds**: None (collecting baseline data first, can add 50% threshold later)
- **Carryforward**: Enabled for all flags (standard for monorepos)
- **Include docs**: Yes (has 2 test files for build scripts)

### Reference Implementation
- Repository: `inquirerjs-checkbox-search` (in workspace)
- Used for vitest coverage config pattern, codecov upload pattern, and badge format

---

## IMPLEMENTATION

### Changes Made

**26 files changed** (25 modified, 1 created):

#### Root Configuration
1. **`package.json`**
   - Added `@vitest/coverage-v8` dependency
   - Added `test:coverage` script

2. **`turbo.json`**
   - Added `test:coverage` task with `outputs: ["coverage/**"]`
   - Added `docs#test:coverage` task (no build dependency)

3. **`codecov.yml`** (new)
   - Defined 7 flags (cli, engine, models, plugin-cursor, plugin-claude, glob-hook, docs)
   - Configured carryforward for all flags
   - Set paths for each flag
   - Disabled project-wide status checks (using per-flag checks instead)

4. **`.github/workflows/ci.yaml`**
   - Changed test step to `pnpm test:coverage`
   - Added 7 codecov upload steps (one per package)
   - Each upload uses `codecov/codecov-action@v5`
   - Each upload specifies package-specific lcov.info file and flag
   - Set `fail_ci_if_error: false` to prevent blocking

#### Per-Package Changes (7 packages)

For each of: cli, engine, models, plugin-cursor, plugin-claude, glob-hook, docs

5. **`packages/*/vitest.config.ts`**
   ```typescript
   coverage: {
     provider: 'v8',
     reporter: ['text', 'lcov'],
     include: ['src/**/*.ts'],  // or 'scripts/**/*.ts' for docs
     exclude: ['test/**/*', 'dist/**/*', 'node_modules/**/*'],
     reportsDirectory: './coverage',
   }
   ```

6. **`packages/*/package.json`**
   - Added `test:coverage` script: `vitest run --coverage`

7. **`packages/*/README.md`**
   - Added codecov badge below npm version badge
   - Badge URL: `https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=<flag-name>`

#### Lockfile
8. **`pnpm-lock.yaml`**
   - Updated with `@vitest/coverage-v8@2.1.9` and its dependencies

### Implementation Approach

**Systematic Phase Execution**:
1. Phase 1: Dependencies - Added coverage dependency
2. Phase 2: Coverage Config - Updated all 7 vitest.config.ts files
3. Phase 3: Package Scripts - Added test:coverage to all 7 packages
4. Phase 4: Root Config - Updated root scripts and turbo.json
5. Phase 5: Codecov Config - Created codecov.yml with flags
6. Phase 6: CI Workflow - Updated workflow with coverage uploads
7. Phase 7: Badges - Added badges to all 7 READMEs
8. Phase 8: Manual Setup - Documented for user (post-merge)
9. Phase 9: Verification - Ran tests locally, all passed

**Tools Used**:
- Vitest with v8 coverage provider
- Codecov action v5
- Turbo for monorepo task orchestration

---

## TESTING

### Local Verification
- Ran `pnpm install --no-frozen-lockfile` to update lockfile
- Ran `pnpm build` - all 6 packages built successfully
- Ran `pnpm test:coverage` - all 7 packages generated coverage

### Test Results
| Package | Tests | Status | Coverage Generated |
|---------|-------|--------|-------------------|
| CLI | 102 | ✅ Pass | ✅ Yes |
| Engine | Multiple | ✅ Pass | ✅ Yes |
| Models | 62 | ✅ Pass | ✅ Yes |
| Plugin-Cursor | Multiple | ✅ Pass | ✅ Yes |
| Plugin-Claude | Multiple | ✅ Pass | ✅ Yes |
| Glob-Hook | 37 | ✅ Pass | ✅ Yes |
| Docs | Multiple | ✅ Pass | ✅ Yes |

**Total**: 102+ tests passing across all packages

### Coverage Reports
- All packages generated `coverage/lcov.info` files
- Coverage directories created in each package
- Reports include text and lcov formats

### CI Validation
- Draft PR created for CI validation
- Awaiting first CI run with coverage uploads
- Manual setup (CODECOV_TOKEN) required before badges render

---

## CHALLENGES & SOLUTIONS

### Challenge 1: Docs Package Coverage Pattern
**Issue**: Docs package has testable code in `scripts/` not `src/`

**Solution**: Adjusted coverage include pattern:
```typescript
include: ['scripts/**/*.ts']  // instead of src/**/*.ts
```

### Challenge 2: Lockfile Update
**Issue**: `pnpm install` failed with frozen-lockfile error

**Solution**: Used `pnpm install --no-frozen-lockfile` to update lockfile with new dependency (expected behavior when adding dependencies)

### Challenge 3: No Test Thresholds
**Decision**: Started without coverage thresholds

**Rationale**: Collect baseline data first, then set thresholds later if needed (50% suggested)

---

## LESSONS LEARNED

### Process Improvements
1. **Clear Planning Works**: Detailed checklist with specific files made execution straightforward
2. **Reference Implementations Valuable**: Having working example eliminated guesswork
3. **Local Testing Essential**: Running full test suite locally before commit caught issues early
4. **Draft PRs for Validation**: Draft PR allows CI validation before final review

### Technical Insights
1. **Codecov Flags for Monorepos**: Flags are the correct approach for per-package coverage in monorepos
2. **Carryforward Essential**: Prevents coverage drops when packages unchanged in PRs
3. **Badge URLs Before Upload**: Badges return 404 until first coverage upload (expected)
4. **Docs Testing Valuable**: Even 2 test files are worthwhile for critical build scripts

### Architecture Patterns
1. **Consistent Package Structure**: Monorepo consistency enables scalable patterns
2. **Turbo Caching**: Coverage outputs should be cached for CI performance
3. **Non-Blocking Uploads**: Set `fail_ci_if_error: false` for independent package uploads

---

## FILES CHANGED

### Created (1)
- `codecov.yml` - Flag definitions and carryforward config

### Modified (25)
- `package.json` - Root dependency and script
- `turbo.json` - Coverage task configuration
- `.github/workflows/ci.yaml` - Coverage run and 7 uploads
- `pnpm-lock.yaml` - Dependency updates
- `packages/cli/vitest.config.ts` - Coverage config
- `packages/cli/package.json` - Coverage script
- `packages/cli/README.md` - Codecov badge
- `packages/engine/vitest.config.ts` - Coverage config
- `packages/engine/package.json` - Coverage script
- `packages/engine/README.md` - Codecov badge
- `packages/models/vitest.config.ts` - Coverage config
- `packages/models/package.json` - Coverage script
- `packages/models/README.md` - Codecov badge
- `packages/plugin-cursor/vitest.config.ts` - Coverage config
- `packages/plugin-cursor/package.json` - Coverage script
- `packages/plugin-cursor/README.md` - Codecov badge
- `packages/plugin-claude/vitest.config.ts` - Coverage config
- `packages/plugin-claude/package.json` - Coverage script
- `packages/plugin-claude/README.md` - Codecov badge
- `packages/glob-hook/vitest.config.ts` - Coverage config
- `packages/glob-hook/package.json` - Coverage script
- `packages/glob-hook/README.md` - Codecov badge
- `packages/docs/vitest.config.ts` - Coverage config
- `packages/docs/package.json` - Coverage script
- `packages/docs/README.md` - Codecov badge

---

## MANUAL SETUP REQUIRED

After PR merge, complete these steps:

1. **Add repo to Codecov**
   - Go to https://codecov.io/gh/Texarkanine
   - Click "Add new repository" and select `a16n`

2. **Get CODECOV_TOKEN**
   - After adding repo, go to Codecov dashboard for a16n
   - Copy upload token from Settings → General

3. **Add GitHub secret**
   - Go to https://github.com/Texarkanine/a16n/settings/secrets/actions
   - Click "New repository secret"
   - Name: `CODECOV_TOKEN`
   - Value: (paste token from Codecov)

---

## VERIFICATION CHECKLIST

- [x] All tests pass with coverage enabled
- [x] Coverage reports generated for all 7 packages
- [x] Badges added to all READMEs
- [x] CI workflow updated with coverage uploads
- [x] Codecov.yml configured with flags
- [x] Turbo caching configured for coverage
- [x] Draft PR created
- [ ] CI validation complete (pending)
- [ ] Manual Codecov setup complete (user action)
- [ ] Badges rendering correctly (pending first upload)

---

## REFERENCES

### Related Documentation
- **Reflection**: `memory-bank/reflection/reflection-CODECOV-MONOREPO.md`
- **Tasks**: `memory-bank/tasks.md` (archived)
- **Progress**: `memory-bank/progress.md` (archived)

### External References
- **PR**: https://github.com/Texarkanine/a16n/pull/31
- **Commit**: `9823020`
- **Reference Repo**: `inquirerjs-checkbox-search` (in workspace)
- **Codecov Docs**: https://docs.codecov.com/docs/codecov-yaml
- **Codecov Flags**: https://docs.codecov.com/docs/flags

### Flag Names & Badge URLs

| Package | Flag | Badge URL |
|---------|------|-----------|
| cli | `cli` | `https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=cli` |
| engine | `engine` | `https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=engine` |
| models | `models` | `https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=models` |
| plugin-cursor | `plugin-cursor` | `https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=plugin-cursor` |
| plugin-claude | `plugin-claude` | `https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=plugin-claude` |
| glob-hook | `glob-hook` | `https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=glob-hook` |
| docs | `docs` | `https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=docs` |

---

## FUTURE ENHANCEMENTS

### Optional Improvements
1. **Coverage Thresholds**: Add minimum coverage requirements after baseline established
2. **Coverage Trends**: Monitor coverage trends over time per package
3. **Status Checks**: Enable per-flag status checks in GitHub branch protection
4. **Coverage Reports**: Add coverage summary to PR comments

### Pattern for New Packages
When adding new packages to the monorepo, follow this pattern:
1. Add coverage config to `vitest.config.ts`
2. Add `test:coverage` script to `package.json`
3. Add flag to `codecov.yml` with paths and carryforward
4. Add upload step to CI workflow
5. Add badge to README

---

## CONCLUSION

Successfully integrated per-package Codecov coverage tracking across the entire a16n monorepo. The implementation provides granular coverage visibility, scalable patterns for future packages, and maintains all existing test functionality. All 102+ tests pass with coverage enabled. The monorepo is now ready for comprehensive coverage tracking once manual Codecov setup is complete.

**Key Achievement**: Established reusable patterns for monorepo coverage tracking that can scale to additional packages.
