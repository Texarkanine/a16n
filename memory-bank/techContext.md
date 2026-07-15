# Tech Context

TypeScript ESM-only monorepo managed by pnpm workspaces, built with Turborepo, tested with Vitest, and documented with Docusaurus.

## Environment Setup

- Node version pinned in `.nvmrc`
- pnpm version pinned in root `package.json` `packageManager` field
- All packages use `"type": "module"` (ESM-only)
- Minimum Node version declared in root `package.json` `engines` field

## Build Tools

- **pnpm** — workspace dependency management (`pnpm-workspace.yaml` includes `packages/*`)
- **Turborepo** — build orchestration and caching (`turbo.json`); `test` depends on `build`
- **TypeScript** — strict mode, composite projects for monorepo references
- **Docusaurus** — documentation site in `packages/docs/`; excluded from default `pnpm build` (use `pnpm build:full` to include)

## Testing Process

- **Vitest** — unit and integration tests; `pnpm test` (via Turbo) is canonical and always runs Vitest inside each package directory using each package's own `vitest.config.ts`; the root `vitest.config.ts` is a fallback for ad-hoc `npx vitest` invocations
- Integration tests use fixture directories (see `test/integration/fixtures/` in each package)
- Full validation: `pnpm install && pnpm build && pnpm test && pnpm lint && pnpm typecheck`
- TDD process and test-running practices are defined in `.cursor/rules/shared/always-tdd.mdc` and `.cursor/rules/shared/test-running-practices.mdc` — do not duplicate those here

## CI/CD

- **ci.yaml** — build, typecheck, test with coverage, docs build, Codecov upload (per-package flags) on PRs and pushes to main
- **release.yaml** — Release-Please automation for semantic versioning; publishes via `pnpm --filter publish` (OIDC trusted publishing). Release-Please only cuts a release for a package when a commit touches that package's path — per-package `release-as` overrides the version *if* a release is cut but does not force inclusion. The canonical "add a new publishable package" runbook (traps, first-publish OIDC bootstrap, post-publish verification) lives in `CONTRIBUTING.md`
- **docs.yaml** — deploy Docusaurus to GitHub Pages
- **release-lockfile-sync.yaml** — sync pnpm lockfile after releases

## Design System

- **Docs site chrome:** Texarkanine paper/ember Infima tokens in `packages/docs/src/css/custom.css` (cream light / warm charcoal dark). Color mode follows OS preference via `themeConfig.colorMode.respectPrefersColorScheme` in `packages/docs/docusaurus.config.js`.

## Notable Technical Decisions

- MDC frontmatter is parsed with regex, not a YAML parser, because Cursor's format is not standards-compliant YAML
- Claude frontmatter (both `.claude/rules/*.md` and `.claude/skills/*/SKILL.md`) is also parsed with regex, though Claude uses standard YAML — this should be migrated to a proper YAML parser (see GitHub issue)
- `@a16njs/glob-hook` is a standalone utility package for Claude Code hooks; it is **not** used by the conversion pipeline (FileRules are emitted as native `.claude/rules/*.md` with `paths:` frontmatter)
- Generated IR artifacts (when converting to/from the `a16n` format) are written under `.a16n/`
- The `--delete-source` flag is conservative: it only deletes sources that were fully consumed during conversion
- IR version is tracked (currently `v1beta2`); `areVersionsCompatible()` warns on mismatch but still processes items
