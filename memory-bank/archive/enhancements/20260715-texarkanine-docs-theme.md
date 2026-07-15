---
task_id: texarkanine-docs-theme
complexity_level: 2
date: 2026-07-15
status: completed
---

# TASK ARCHIVE: texarkanine-docs-theme

## SUMMARY

Ported the Texarkanine paper/ember palette onto a16n's Docusaurus Infima docs theme (cream light / warm charcoal dark) and enabled system-preference color mode via `respectPrefersColorScheme: true`. Draft PR: https://github.com/Texarkanine/a16n/pull/137. A brief experiment with Material-like orange navbar chrome (`navbar.style: 'primary'`) was tried and rejected — Infima surface navbar retained.

## REQUIREMENTS

- Map Texarkanine tokens from slobac#27 onto Infima CSS variables (not Material selectors)
- Light + dark paired primaries (ember `#b45309` / amber `#de8131` + dark link `#fb923c`)
- Color mode follows OS preference; keep navbar mode switch
- Preserve docs build/deploy behavior

## IMPLEMENTATION

- `packages/docs/src/css/custom.css` — Infima `:root` / `[data-theme='dark']` tokens (bg, surface, font, primary shade ladder, code surfaces)
- `packages/docs/docusaurus.config.js` — `themeConfig.colorMode` with `respectPrefersColorScheme: true`, `disableSwitch: false`
- `memory-bank/techContext.md` — Design System pointer to those files
- Theme contract tests were added during build then removed by operator preference before archive (`chore: don't test that`)

## TESTING

- During build: docs Vitest (including then-present theme contracts) + `docs:build:prose` SUCCESS; QA PASS
- Manual: OS preference / localStorage caveat documented; operator visual QA of primary navbar chrome (rejected)

## LESSONS LEARNED

- Omitting `colorMode.respectPrefersColorScheme` (Docusaurus default `false`) is why the site felt manual-only despite having a toggle
- Infima `--ifm-color-primary` colors accents/links, not header chrome; Material primary fills the header — `navbar.style: 'primary'` is the Docusaurus bridge, but a16n preferred not to use it

## PROCESS IMPROVEMENTS

Nothing notable for this Level 2.

## TECHNICAL IMPROVEMENTS

Nothing beyond the delivered Design System pointer in techContext.

## NEXT STEPS

None for this task. Merge/review remains on PR #137.
