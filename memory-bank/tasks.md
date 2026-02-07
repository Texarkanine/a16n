# Memory Bank: Tasks

## Current Task: Phase 9 Milestone 7 — Documentation & Integration Testing

**Status:** PLANNING
**Complexity:** Level 3
**Last Updated:** 2026-02-07

---

## Scope

Complete Phase 9 by adding cross-format E2E tests, plugin-a16n documentation to the docsite, CHANGELOG pages for all modules, Google Analytics/site verification, and housekeeping fixes.

---

## Task Checklist

### A: E2E Tests

- [ ] A1: Cross-format test — cursor → a16n → claude round-trip
- [ ] A2: Cross-format test — claude → a16n → cursor round-trip
- [ ] A3: Version mismatch warning E2E test (discover IR files with incompatible version)

### B: Plugin a16n Documentation

- [ ] B1: Create `docs/plugin-a16n/index.md` (follow plugin-cursor/plugin-claude pattern)
- [ ] B2: Create `docs/plugin-a16n/api.mdx` (VersionPicker component, same as other plugins)
- [ ] B3: Add "Plugin: a16n IR" section to `sidebars.js`
- [ ] B4: Add `@a16njs/plugin-a16n` to packages table in `docs/intro.md`
- [ ] B5: Add cross-references ("See Also" links) to plugin-cursor & plugin-claude docs

### C: API Doc Generation Pipeline

- [ ] C1: Add `plugin-a16n` to `PACKAGES` array in `scripts/generate-versioned-api.ts`
- [ ] C2: Add `packages/plugin-a16n/src` to `WORKSPACE_PACKAGE_PATHS`
- [ ] C3: Add `apidoc:current:plugin-a16n` script to `packages/docs/package.json`
- [ ] C4: Add plugin-a16n to `apidoc:current` pipeline in `package.json`

### D: CHANGELOG Integration

- [ ] D1: Extend `stage` script to copy each package's CHANGELOG.md into `.generated/<module>/changelog.md` with frontmatter
- [ ] D2: Add `changelog` sidebar entries after each module's overview

### E: Google Analytics & Site Verification

- [ ] E1: Add `<meta name="google-site-verification" content="E9y_GjlmgYsMt4Bjilx2Y201XFZFLyEMn5hQgCXS_z4" />` via `headTags` in `docusaurus.config.js`
- [ ] E2: Add `@docusaurus/plugin-google-gtag` config with env-based measurement ID (needs GA4 Measurement ID — placeholder for now)

### F: Housekeeping

- [ ] F1: Replace `packages/docs/README.md` with a brief package summary (current 253-line build guide causes GitHub to show wrong content)
- [ ] F2: Update `packages/plugin-a16n/README.md` development status (M7 complete)

---

## Implementation Plan

### Phase 1: Tests First (TDD)

**A1–A3**: Add integration tests to `packages/cli/test/integration/integration.test.ts`.

Cross-format tests (A1, A2) create source fixtures in-memory, convert source→a16n, then a16n→target, verifying content arrives correctly. These exercise a16n as a hub format.

Version mismatch test (A3) creates an `.a16n/` fixture with `version: v2` (incompatible with current `v1beta1`), runs `discover`, and asserts `WarningCode.VersionMismatch` is emitted.

All tests should **pass immediately** — the functionality is already implemented. These are validation tests.

### Phase 2: Documentation Pages

**B1**: `docs/plugin-a16n/index.md` — overview, installation, directory structure, file format, programmatic usage. Follow the pattern of plugin-cursor's index.md but with a16n-specific content from the plugin README. Keep it concise.

**B2**: `docs/plugin-a16n/api.mdx` — VersionPicker component wrapper, identical pattern to other plugins.

**B3–B5**: Wire into sidebar, intro page, and cross-reference from other plugin docs.

### Phase 3: API Doc Generation

**C1–C4**: Add `plugin-a16n` to the TypeDoc generation pipeline so versioned API docs are generated from git tags. Same pattern as existing plugins.

### Phase 4: CHANGELOG Pages

**D1**: Modify the `stage` script to:
1. After `cp -r docs/* .generated/`, loop over packages
2. For each package with a CHANGELOG.md, generate a `.generated/<module>/changelog.md` containing frontmatter + CHANGELOG content

Package → docs dir mapping:
| Package dir | Docs dir |
|------------|----------|
| `cli` | `cli` |
| `engine` | `engine` |
| `models` | `models` |
| `plugin-cursor` | `plugin-cursor` |
| `plugin-claude` | `plugin-claude` |
| `plugin-a16n` | `plugin-a16n` |
| `glob-hook` | `glob-hook` |

Skip `docs` package's own CHANGELOG (meta, not useful to users).

**D2**: Add changelog entries to each module's sidebar category, after the overview page.

### Phase 5: Analytics & Housekeeping

**E1**: Add `headTags` to `docusaurus.config.js` for Google Search Console verification.

**E2**: Add `gtag` config to `themeConfig` in `docusaurus.config.js`. The measurement ID should come from an env var (`GTAG_ID`) so it doesn't need to be hardcoded. If env var is absent, GA simply won't load.

**F1**: Replace `packages/docs/README.md` with a brief summary. Move detailed build docs to a comment or trim significantly.

**F2**: Mark all M7 milestones complete in plugin-a16n's README.

### Verification

```bash
pnpm build          # all packages build
pnpm test           # all tests pass (including new E2E)
pnpm --filter docs build:prose  # docsite builds with new pages
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| CHANGELOGs generated at stage time, not committed as docs/ files | Avoids duplication; always shows latest CHANGELOG from source |
| GA measurement ID via env var | Keeps secrets out of config; graceful degradation when absent |
| `headTags` for site verification | Docusaurus-native approach, no plugin needed |
| Cross-format E2E tests in existing integration.test.ts | Consistent with M6 pattern |

---

## Files Modified

| File | Change |
|------|--------|
| `packages/cli/test/integration/integration.test.ts` | Add 3 E2E test cases |
| `packages/docs/docs/plugin-a16n/index.md` | **New** — plugin overview |
| `packages/docs/docs/plugin-a16n/api.mdx` | **New** — API reference landing |
| `packages/docs/sidebars.js` | Add plugin-a16n + changelog entries |
| `packages/docs/docs/intro.md` | Add plugin-a16n to packages table |
| `packages/docs/docs/plugin-cursor/index.md` | Add plugin-a16n to "See Also" |
| `packages/docs/docs/plugin-claude/index.md` | Add plugin-a16n to "See Also" |
| `packages/docs/docusaurus.config.js` | headTags (site verification) + gtag |
| `packages/docs/package.json` | stage script + apidoc scripts for plugin-a16n |
| `packages/docs/scripts/generate-versioned-api.ts` | Add plugin-a16n to PACKAGES + WORKSPACE_PACKAGE_PATHS |
| `packages/docs/README.md` | Replace with brief summary |
| `packages/plugin-a16n/README.md` | Update development status |
