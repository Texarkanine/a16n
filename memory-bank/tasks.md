# Memory Bank: Tasks

## Current Task: Codecov Integration for Monorepo

**Task ID**: CODECOV-MONOREPO
**Created**: 2026-02-03
**Status**: Planning Complete, Ready for Implementation

---

## Objective

Add Codecov coverage tracking to all packages in the a16n monorepo with **distinct coverage badges per package** using Codecov's Flags feature.

## Reference Implementation

- Repository: `inquirerjs-checkbox-search` (in workspace)
- Key files:
  - `.github/workflows/release-please.yaml` (lines 57-62: codecov upload)
  - `vitest.config.ts` (lines 25-44: coverage config)
  - `README.md` (line 4: badge)

## Architecture Decision

**Codecov Flags** - Each package uploads coverage separately with its own flag, enabling:
- Per-package coverage percentages
- Per-package badges: `https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=<flag-name>`
- Per-package status checks in PRs
- Carryforward support (preserves coverage when package unchanged)

## Configuration Decisions

| Setting | Value | Rationale |
|---------|-------|-----------|
| Thresholds | None (50% if required) | Collecting data first |
| Carryforward | Enabled | Standard for monorepos |
| Include docs | Yes | Has 2 test files |

---

## Implementation Checklist

### Phase 1: Dependencies
- [ ] Add `@vitest/coverage-v8` to root `package.json`
- [ ] Run `pnpm install`

### Phase 2: Coverage Configuration
Update each package's `vitest.config.ts` with coverage settings:
- [ ] `packages/cli/vitest.config.ts`
- [ ] `packages/engine/vitest.config.ts`
- [ ] `packages/models/vitest.config.ts`
- [ ] `packages/plugin-cursor/vitest.config.ts`
- [ ] `packages/plugin-claude/vitest.config.ts`
- [ ] `packages/glob-hook/vitest.config.ts`
- [ ] `packages/docs/vitest.config.ts`

### Phase 3: Package Scripts
Add `test:coverage` script to each package:
- [ ] `packages/cli/package.json`
- [ ] `packages/engine/package.json`
- [ ] `packages/models/package.json`
- [ ] `packages/plugin-cursor/package.json`
- [ ] `packages/plugin-claude/package.json`
- [ ] `packages/glob-hook/package.json`
- [ ] `packages/docs/package.json`

### Phase 4: Root Configuration
- [ ] Add `test:coverage` script to root `package.json`
- [ ] Add `test:coverage` task to `turbo.json`

### Phase 5: Codecov Configuration
- [ ] Create `codecov.yml` at repo root

### Phase 6: CI Workflow
- [ ] Update `.github/workflows/ci.yaml` with coverage + uploads

### Phase 7: README Badges
Add codecov badge to each package README:
- [ ] `packages/cli/README.md`
- [ ] `packages/engine/README.md`
- [ ] `packages/models/README.md`
- [ ] `packages/plugin-cursor/README.md`
- [ ] `packages/plugin-claude/README.md`
- [ ] `packages/glob-hook/README.md`
- [ ] `packages/docs/README.md`

### Phase 8: Manual GitHub Configuration
- [ ] Add a16n repo to Codecov (https://codecov.io/gh/Texarkanine)
- [ ] Copy CODECOV_TOKEN from Codecov dashboard
- [ ] Add `CODECOV_TOKEN` secret to GitHub repo

### Phase 9: Verification
- [ ] Run `pnpm test:coverage` locally
- [ ] Verify coverage reports generated in each `packages/*/coverage/`
- [ ] Push and verify CI uploads to Codecov
- [ ] Verify badges render correctly

---

## Files to Create

| File | Purpose |
|------|---------|
| `codecov.yml` | Flag definitions, carryforward config |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` (root) | Add `@vitest/coverage-v8`, `test:coverage` script |
| `turbo.json` | Add `test:coverage` task |
| `.github/workflows/ci.yaml` | Add coverage run + 7 codecov uploads |
| `packages/*/vitest.config.ts` (7 files) | Add coverage configuration |
| `packages/*/package.json` (7 files) | Add `test:coverage` script |
| `packages/*/README.md` (7 files) | Add codecov badge |

---

## Technical Details

### Vitest Coverage Config Pattern

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  include: ['src/**/*.ts'],
  exclude: [
    'test/**/*',
    'dist/**/*',
    'node_modules/**/*',
  ],
  reportsDirectory: './coverage',
},
```

### Flag Names (must be alphanumeric, _, -, . only)

| Package | Flag Name |
|---------|-----------|
| packages/cli | `cli` |
| packages/engine | `engine` |
| packages/models | `models` |
| packages/plugin-cursor | `plugin-cursor` |
| packages/plugin-claude | `plugin-claude` |
| packages/glob-hook | `glob-hook` |
| packages/docs | `docs` |

### Badge URLs

```markdown
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=cli)](https://codecov.io/gh/Texarkanine/a16n)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=engine)](https://codecov.io/gh/Texarkanine/a16n)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=models)](https://codecov.io/gh/Texarkanine/a16n)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=plugin-cursor)](https://codecov.io/gh/Texarkanine/a16n)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=plugin-claude)](https://codecov.io/gh/Texarkanine/a16n)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=glob-hook)](https://codecov.io/gh/Texarkanine/a16n)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=docs)](https://codecov.io/gh/Texarkanine/a16n)
```

### CI Upload Pattern

```yaml
- name: Upload <Package> coverage
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./packages/<package>/coverage/lcov.info
    flags: <flag-name>
    fail_ci_if_error: false
```

---

## Recent Archives

See `memory-bank/archive/` for completed task documentation.
