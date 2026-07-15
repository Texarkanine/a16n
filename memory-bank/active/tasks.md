# Task: texarkanine-docs-theme

* Task ID: texarkanine-docs-theme
* Complexity: Level 2
* Type: simple enhancement

Port the Texarkanine paper/ember palette from [slobac#27](https://github.com/Texarkanine/slobac/pull/27) onto a16n's Docusaurus Infima theme (light + dark), and enable system-preference color mode via `themeConfig.colorMode.respectPrefersColorScheme: true`.

## Test Plan (TDD)

### Behaviors to Verify

- [Light primary tokens]: reading `packages/docs/src/css/custom.css` `:root` block → contains Texarkanine light primary `#b45309` and page background `#f6f0e4`
- [Dark primary tokens]: reading `[data-theme='dark']` block → contains Texarkanine dark primary `#de8131`, background `#1c1914`, and link accent `#fb923c` (via `--ifm-link-color` or equivalent asserted token)
- [Code surfaces]: light block → code background `#ebe4d4`; dark block → `#2a251c`
- [System preference]: reading `packages/docs/docusaurus.config.js` → `themeConfig.colorMode.respectPrefersColorScheme === true` (or equivalent source text asserting `true`)
- [Mode switch retained]: config → `colorMode.disableSwitch` is not `true` (switch remains available)
- [Regression]: existing `packages/docs` Vitest suite still passes after theme changes

### Edge Cases

- [Partial token set]: CSS must define both light and dark blocks — asserting only `:root` without dark must fail the dark-token tests
- [Wrong Material selectors]: custom.css must use Infima/`[data-theme='dark']`, not Material `[data-md-color-scheme=...]` (guard against copy-paste of slobac CSS)
- [Stored preference]: automated tests cover config + CSS contracts only; system-preference activation with a clean preference store is manual QA (Docusaurus may honor prior `localStorage` after a manual toggle — expected)

### Test Infrastructure

- Framework: Vitest (`packages/docs` — `pnpm test` / `"test": "vitest run"`)
- Test location: `packages/docs/test/`
- Conventions: `*.test.ts` beside script-focused suites (`generate-cli-docs.test.ts`, `generate-versioned-api.test.ts`); file-level JSDoc when the suite purpose is not obvious from the name; `describe`/`it`/`expect` from `vitest`
- New test files: `packages/docs/test/docs-theme-tokens.test.ts`

## Implementation Plan

1. [x] **Stub + implement theme contract tests (expect fail)**
   - Files: `packages/docs/test/docs-theme-tokens.test.ts`
   - Changes: Read `src/css/custom.css` and `docusaurus.config.js` from package root; assert Texarkanine light/dark hex tokens and `respectPrefersColorScheme: true`; assert absence of Material scheme selectors; run suite and confirm new cases fail against current green Infima defaults / missing `colorMode` block

2. [x] **Enable system-preference color mode**
   - Files: `packages/docs/docusaurus.config.js`
   - Changes: Add `themeConfig.colorMode` with `respectPrefersColorScheme: true`, `disableSwitch: false`, and a sensible `defaultMode` (unused when prefers-color-scheme is respected — document in comment or leave `'light'` as fallback for unsupported environments)

3. [x] **Apply Texarkanine Infima tokens**
   - Files: `packages/docs/src/css/custom.css`
   - Changes: Replace green/teal primary ladders with Texarkanine paper/ember tokens mapped from slobac `extra.css`

4. [x] **Document design-system pointer**
   - Files: `memory-bank/techContext.md`
   - Changes: Add a short **Design System** section pointing at `packages/docs/src/css/custom.css` as the Texarkanine docs token authority

5. [x] **Verify package suite + docs build path**
   - Files: none (verification)
   - Changes: Run `packages/docs` Vitest suite; run `docs:build:prose` — 44 tests pass; build SUCCESS

## Technology Validation

No new technology - validation not required (existing Docusaurus `colorMode` + Infima CSS variables; docs: https://docusaurus.io/docs/api/themes/configuration#color-mode--dark-mode)

## Dependencies

- Canonical token source: Texarkanine palette in slobac `skills/slobac-audit/references/docs/stylesheets/extra.css` (slobac#27)
- Docusaurus classic theme Infima variables (`--ifm-*`) and `[data-theme='dark']`
- Existing `packages/docs` Vitest + docusaurus build scripts

## Challenges & Mitigations

- **Infima shade ladder contrast**: Ember/amber primaries may fail WCAG on cream/charcoal for some UI chrome → generate a full primary shade ladder; spot-check navbar/sidebar active/link contrast during QA; adjust only shade steps if needed without abandoning Texarkanine hues
- **Cool-gray leftover chrome**: Infima emphasis/code defaults may stay cool → explicitly set background, surface, and code variables in both modes
- **System preference vs prior toggle**: Users who already toggled may have `localStorage` override → acceptance focuses on fresh preference store / first-visit behavior; keep the switch so users can still override
- **Material CSS copy-paste**: Wrong selectors would silently no-op → contract test forbids `[data-md-color-scheme`

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [ ] QA

## Preflight Findings

- PASS — TDD ordering explicit (step 1 tests before config/CSS); touchpoints limited to `packages/docs` + `techContext.md`; VersionPicker already consumes `--ifm-*` so no separate restyle needed
- Advisory: do not share a cross-repo token package with slobac in this task (out of brief / would raise complexity); keep a16n CSS as the local authority with techContext pointer
