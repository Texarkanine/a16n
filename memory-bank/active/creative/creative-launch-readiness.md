# Decision: Launch Readiness — What Must Be Fixed Before Public Announcement

## Context

a16n is being prepared for its first public announcement (Show HN, LinkedIn, blog post). The tool works, has been used by the author, and is published on npm. The question is: **what, if anything, must be addressed before inviting strangers to try it?**

This matters because first impressions are permanent in open source. A security issue, a broken link in the README, or a confusing first-run experience will turn away the exact early adopters the project needs. The bar isn't perfection — it's "does this hold up when someone besides the author tries it for the first time?"

### Constraints
- The project is known to be incomplete (Phase 9+ planned, many GitHub issues filed for future work)
- We're not looking for completeness, we're looking for embarrassments, hazards, and friction
- Build passes, all 164 tests pass, typecheck passes
- 9 open GitHub issues exist, all labeled `enhancement`

## Options Evaluated

- **Option A: Ship as-is** — Everything builds and tests pass; the existing state is good enough.
- **Option B: Fix critical issues only** — Address security bugs and broken user-facing artifacts, but don't polish beyond that.
- **Option C: Comprehensive polish** — Fix everything found, including code style, test gaps, warning UX, and documentation.

## Analysis

### Findings from Full Codebase Audit

The audit covered: CLI UX, error handling, package.json metadata, documentation, CI/CD, code quality, type safety, test coverage, security, warning system, conversion quality, plugin extensibility, and integration test coverage.

#### Current Strengths
- Clean architecture, well-documented IR types and plugin interface
- 164 tests all passing across 7 test files
- Build, typecheck clean
- Good error messages for most scenarios (invalid paths, empty projects)
- `--dry-run` works well for preview
- Warning system with icons, hints, and structured output
- Plugin discovery/loading works for community plugins (validated with `a16n-plugin-cursorrules`)
- Conversion quality verified through fixture-based integration tests
- `--delete-source` is conservatively safe
- `--rewrite-path-refs` uses sound longest-match-first approach

#### Issues Found, Ranked by Severity

| # | Issue | Severity | Effort | Category |
|---|-------|----------|--------|----------|
| 1 | **Path traversal in plugin-claude `emitAgentSkillIO`** — filenames from `skill.files` are joined with `path.join(skillDir, filename)` without any validation. Plugin-cursor has comprehensive checks (absolute path, `..`, resolved prefix). A crafted skill could write files outside the intended directory. | **Critical** | ~30 min | Security |
| 2 | **Missing `CONTRIBUTING.md`** — README line 64 links to `./CONTRIBUTING.md` which doesn't exist. FAQ also references "contribution guidelines" that don't exist. First contributor hits a 404. | **High** | ~1 hr | Documentation |
| 3 | **Broken docs link: `/plugin-cursorrules`** — Plugin development page links to a non-existent doc page about the cursorrules reference plugin. | **Medium** | ~10 min | Documentation |
| 4 | **CLI reference link mismatch in docs** — Multiple pages link to `/cli/reference` but the generated doc lives at `/cli/reference/current`. Intro "CLI Reference" link goes to `/cli` (the overview, not the reference). | **Medium** | ~20 min | Documentation |
| 5 | **Invalid `--from`/`--to` error message has no guidance** — `Error: Unknown source: curser` with no mention of valid values or `a16n plugins`. First-time user must guess. | **Medium** | ~20 min | CLI UX |
| 6 | **`pnpm lint` is a complete no-op** — No package defines a `lint` script. No ESLint, Prettier, or any linter configured. `turbo run lint` outputs "0 tasks". GitHub issue #74 (OXC Linter) tracks this as future work. | **Low** | Large | Code quality |
| 7 | **Missing `engines` in CLI `package.json`** — Root has `"node": ">=18.0.0"` and glob-hook has it, but the CLI package (the one users `npx`) doesn't declare it. Older Node versions will fail with cryptic ESM errors. | **Low** | ~5 min | Package metadata |
| 8 | **11 stubbed test bodies** — Git conflict tests in `cli.test.ts` have `// TODO: Implement test` with empty bodies. They pass vacuously. | **Low** | ~2 hrs | Test coverage |
| 9 | **Warning hints incomplete** — Only 4 of 10 warning codes have user-facing hints. `skipped`, `overwritten`, `file-renamed`, `version-mismatch`, `orphan-path-ref`, `operation-failed` have no hints. | **Low** | ~30 min | CLI UX |
| 10 | **2 unused warning codes** — `BoundaryCrossing` and `Overwritten` are defined but never emitted anywhere in the codebase. | **Low** | ~10 min | Code quality |
| 11 | **`any` types in convert.ts** — `routeConflict` and `routeConflictSimple` use `any[]` for git status objects (with eslint-disable comments). | **Low** | ~30 min | Type safety |
| 12 | **Docusaurus social card is default** — `image: 'img/docusaurus-social-card.jpg'` with comment "Replace with your project's social card". | **Low** | ~30 min | Branding |
| 13 | **glob-hook README doesn't say it's optional** — Package README doesn't mention that glob-hook is no longer needed for standard a16n conversions (docs site does, but npm README doesn't). | **Low** | ~10 min | Documentation |

### Comparison

| Criterion | Option A (Ship as-is) | Option B (Critical fixes) | Option C (Full polish) |
|-----------|----------------------|--------------------------|----------------------|
| Security | Path traversal bug ships | Fixed | Fixed |
| First impression | Broken links, missing docs | Clean first-run | Polished |
| Effort | 0 | ~2-3 hours | ~8-10 hours |
| Risk of delay | None | None | Medium |
| Reversibility | Can fix later but damage done | Good balance | Overkill for launch |

Key insights:
- The path traversal bug (#1) is a genuine security issue. It's not exploitable in typical use (skill files come from the user's own project), but it's a code quality signal that matters for credibility — and a real risk if someone converts untrusted skill repositories.
- The missing CONTRIBUTING.md (#2) and broken docs links (#3, #4) are guaranteed to be hit by anyone who engages with the project beyond basic usage.
- The CLI error message (#5) and engines field (#7) affect first-run experience for the exact persona you're targeting (developer trying the tool for the first time).
- Items #6-#13 are real but tolerable for launch. They're "we know and we'll get to it" territory.

## Decision

**Selected**: Option B — Fix critical issues only

**Rationale**: The security fix and first-impression issues are cheap to fix (~2-3 hours total) and high-impact for launch credibility. Everything else is either already tracked (#74 for linting) or low enough severity that it won't turn away early adopters. The project's architecture, test coverage, and core functionality are solid — the issues are at the edges.

**Tradeoff**: Stubbed tests and incomplete warning hints ship unfixed, but they don't affect users directly. The linter gap is tracked as issue #74.

## Implementation Notes

### Must-Fix Before Launch (do these)

1. **Path traversal in plugin-claude emit** (`packages/plugin-claude/src/emit.ts:231-253`)
   - Add the same validation as plugin-cursor (`packages/plugin-cursor/src/emit.ts:346-365`)
   - Check `path.isAbsolute(filename)`, `filename.includes('..')`, and `resolvedPath.startsWith(baseDir)`
   - Emit `WarningCode.Skipped` for unsafe paths

2. **Create `CONTRIBUTING.md`** at repo root
   - Can be brief: dev setup instructions, how to run tests, PR expectations, link to issues
   - Matches the README and FAQ references

3. **Fix docs broken links**
   - Remove or fix `/plugin-cursorrules` link in `packages/docs/docs/plugin-development/index.md`
   - Fix CLI reference links to point to correct URL (or add redirect)
   - Fix intro "CLI Reference" → point to actual reference page

4. **Improve invalid agent error messages** in CLI
   - When engine throws `Unknown source/target`, add suggestion: `Run 'a16n plugins' to see available agents.`
   - Consider using Commander `.choices()` for `--from`/`--to` options

5. **Add `engines` to CLI `package.json`**
   - `"engines": { "node": ">=18.0.0" }` to match root and glob-hook

### Not Already GitHub Issues (consider filing)

These items surfaced during the audit but don't match any of the 9 open GitHub issues:

- **Warning hints for all codes** — `skipped`, `overwritten`, `file-renamed`, `version-mismatch`, `orphan-path-ref`, `operation-failed` have no user-facing hints in `output.ts`
- **Unused warning codes cleanup** — `BoundaryCrossing` and `Overwritten` are defined but never emitted; either use them or remove them
- **Stubbed git-conflict tests** — 11 test bodies in `cli.test.ts` with `// TODO: Implement test`
- **Type `any` in convert.ts** — `routeConflict`/`routeConflictSimple` use untyped arrays
- **Cross-platform CI** — Only runs on `ubuntu-latest`; no Windows/macOS coverage
- **Discover command enrichment** — Human output shows only type and path; could show globs, descriptions, summary by type
- **Docusaurus social card** — Still using default placeholder
- **glob-hook README: note it's optional** — npm README doesn't mention glob-hook is no longer needed for standard conversions
