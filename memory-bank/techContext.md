# Memory Bank: Technical Context

## Technology Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | TypeScript | Type safety for plugin interfaces |
| Package Manager | pnpm | workspace:* protocol, strict node_modules, fast |
| Build Orchestration | Turborepo | Minimal config, aggressive caching |
| Versioning | Release-Please | Automated semantic versioning via GitHub Actions |
| Testing | Vitest | Fast, modern, great TypeScript support |
| Glob Matching | micromatch | Battle-tested, comprehensive glob support |
| Documentation | Docusaurus | Versioned API docs, MDX support |
| CLI Framework | Commander | Standard Node.js CLI library |

## Package Structure

| Package | Version | Purpose |
|---------|---------|---------|
| `a16n` | 0.6.0 | CLI tool |
| `@a16njs/models` | 0.5.0 | IR types, plugin interface |
| `@a16njs/engine` | 0.3.0 | Conversion orchestration |
| `@a16njs/plugin-cursor` | 0.5.0 | Cursor IDE support |
| `@a16njs/plugin-claude` | 0.5.0 | Claude Code support |
| `@a16njs/glob-hook` | 0.1.0 | Glob matcher for Claude hooks |
| `docs` | — | Docusaurus documentation site |

## Intermediate Representation (IR) Types

```typescript
enum CustomizationType {
  GlobalPrompt = 'global-prompt',           // Always-applied prompts
  SimpleAgentSkill = 'simple-agent-skill',  // Description-triggered skills
  AgentSkillIO = 'agent-skill-io',          // Complex skills with resources
  FileRule = 'file-rule',                   // Glob-triggered rules
  AgentIgnore = 'agent-ignore',             // Exclusion patterns
  ManualPrompt = 'manual-prompt',           // User-requested prompts (slash commands)
}
```

## Tool Mappings

### Cursor Sources/Targets

| IR Type | Cursor Location | Notes |
|---------|-----------------|-------|
| GlobalPrompt | `.cursor/rules/*.mdc` | `alwaysApply: true` |
| FileRule | `.cursor/rules/*.mdc` | `globs:` frontmatter |
| SimpleAgentSkill | `.cursor/skills/<name>/SKILL.md` | `description:` only |
| AgentSkillIO | `.cursor/skills/<name>/` | Multi-file skills |
| AgentIgnore | `.cursorignore` | gitignore-style patterns |
| ManualPrompt | `.cursor/commands/**/*.md` | Simple commands only |

### Claude Sources/Targets

| IR Type | Claude Location | Notes |
|---------|-----------------|-------|
| GlobalPrompt | `CLAUDE.md` (nestable) | Merges multiple |
| FileRule | `.claude/settings.local.json` + `.a16n/rules/` | Via glob-hook |
| SimpleAgentSkill | `.claude/skills/<name>/SKILL.md` | Standard format |
| AgentSkillIO | `.claude/skills/<name>/` | Multi-file skills |
| AgentIgnore | `.claude/settings.json` | `permissions.deny` |
| ManualPrompt | `.claude/skills/<name>/SKILL.md` | Emitted only, never discovered |

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Warn on lossy conversion, don't fail | Better UX than blocking |
| FileRule via hooks + glob-hook | Deterministic matching |
| MDC frontmatter via regex | Cursor's format isn't standard YAML |
| Skip skills with hooks | Hooks are Claude-specific, not AgentSkills.io |
| `.a16n/` for generated artifacts | Clean separation from tool configs |
| `--delete-source` conservative | Only delete fully-used sources |

## Build Commands

```bash
# Full build and test
pnpm install
pnpm build
pnpm test

# Development
pnpm build            # Build all (excludes docs)
pnpm build:full       # Build all including docs
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm typecheck        # Type check all packages
```

## CI/CD

- **ci.yaml**: Build, test, lint on PRs and pushes
- **release.yaml**: Release-please automation for versioning
- **docs.yaml**: Deploy Docusaurus to GitHub Pages
- **release-lockfile-sync.yaml**: Sync pnpm lockfile after releases

## File Conventions

- **ESM-only**: All packages use `"type": "module"`
- **Node 18+**: Required for native ESM support
- **Vitest config**: Root `vitest.config.ts` with per-package overrides
- **TypeScript**: Strict mode, composite projects for monorepo
