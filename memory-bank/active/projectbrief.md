# Project Brief

## User Story

As a docs reader (and site maintainer), I want the a16n Docusaurus site to use the Texarkanine paper/ember color scheme in both light and dark modes, with the mode following system preference by default, so the docs feel on-brand and respect OS appearance without a manual toggle as the first experience.

## Use-Case(s)

### Browse docs in light mode

Visitor with a light system preference sees cream paper backgrounds, dark warm text, and ember accents matching the Texarkanine palette from slobac#27.

### Browse docs in dark mode

Visitor with a dark system preference sees warm charcoal backgrounds, cream text, and amber/orange accents (paired dark tokens, not a single shared primary hex).

### Prefer system appearance

On first visit (and when no overriding stored preference blocks it), the site activates light or dark from `prefers-color-scheme` rather than forcing a manual-only default.

## Requirements

1. Port the Texarkanine paper/ember palette (source: [Texarkanine/slobac#27](https://github.com/Texarkanine/slobac/pull/27) / Material `extra.css` tokens) onto Docusaurus Infima CSS variables in `packages/docs`.
2. Support both light and dark modes with the paired token sets (ember primary in light; softer amber primary + brighter orange links in dark).
3. Configure Docusaurus `colorMode` so system preference is respected (`respectPrefersColorScheme: true`); keep the navbar mode switch available unless planning decides otherwise.
4. Preserve existing docs structure, content, and build/deploy behavior.

## Constraints

1. Docs stack is Docusaurus + Infima in `packages/docs/` — not MkDocs Material; map tokens, do not copy Material CSS selectors.
2. Scope is visual theming / color-mode config; no content rewrite or layout redesign.
3. Optional polish (Prism theme swap, social card, logo) is out of scope unless needed for basic readability of the new palette.

## Acceptance Criteria

1. Light mode visually matches the Texarkanine cream/ember intent (page bg, text, primary accents, code surfaces).
2. Dark mode visually matches the Texarkanine warm-charcoal/amber–orange intent.
3. With OS set to light or dark, a fresh visit (or equivalent preference-respecting path) activates the corresponding mode without requiring a manual toggle first.
4. Docs site still builds successfully (`packages/docs` / CI docs build path).
