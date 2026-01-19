# a16n Product Brief

**Agent Customization Portability**

## Problem Statement

Development teams increasingly use multiple AI coding agents — Cursor, Claude Code, Codex, Windsurf, and others. Each tool has evolved its own convention for customization:

- **Cursor**: `.cursor/rules/*.mdc` files with YAML frontmatter (globs, descriptions, `alwaysApply`)
- **Claude Code**: `CLAUDE.md` files (nestable), `/mnt/skills/` directories, tool hooks
- **Others**: Various proprietary formats

When teams switch tools, try new ones, or use multiple agents across different contexts, they face a painful choice: manually recreate all their carefully-crafted prompts and rules, or lose that customization entirely.

This friction slows adoption of better tools and fragments institutional knowledge about how to work effectively with AI assistants.

## Solution

**a16n** is a CLI tool and library that translates agent customization between coding tools.

```bash
# One command to migrate your setup
npx a16n convert --from cursor --to claude ./my-project
```

That's it. Your Cursor rules become Claude configuration. Your team's carefully-tuned prompts come with you.

## User Stories

### Individual Developer
> "I've been using Cursor for 6 months and built up a bunch of rules for how I like it to handle React components. My company just got Claude Code licenses. I don't want to start over."

**a16n solution**: Run one command, get equivalent `CLAUDE.md` and skill files.

### Team Lead
> "Half my team uses Cursor, half uses Claude Code. We want shared coding standards but maintaining two sets of rules is a nightmare."

**a16n solution**: Maintain one canonical format, generate others on demand. Add to CI if desired.

### Open Source Maintainer
> "I want to ship agent customization with my library so contributors get good AI assistance out of the box, but I can't predict what tools they use."

**a16n solution**: Ship one format, document how contributors can convert to their preferred tool.

## Key Benefits

### 1. Tool Freedom
Try new coding agents without losing your setup. Switch tools when better ones emerge. Use different tools for different projects.

### 2. Team Consistency
Maintain one source of truth for agent behavior. Generate tool-specific configs as build artifacts.

### 3. Reduced Lock-in
Your investment in agent customization is portable. Tools compete on merit, not switching costs.

### 4. Community Sharing
Share agent rules in a portable format. Import configs from others regardless of their tool choice.

## Non-Goals

a16n does **not**:
- Provide agent customization authoring tools (use your preferred editor)
- Sync configs in real-time (it's a converter, not a daemon)
- Guarantee perfect fidelity (some features don't translate; see Limitations)
- Replace tool-specific documentation (you still need to understand your tools)

## Limitations & Transparency

Agent tools have different capabilities. a16n handles this honestly:

| Scenario | Behavior |
|----------|----------|
| Feature exists in both tools | Translates faithfully |
| Feature exists only in source | Emits warning, skips or approximates |
| Multiple sources → single target | Merges with warning about irreversibility |
| Target has richer feature | Uses sensible defaults |

**Example**: Three Cursor rules with `alwaysApply: true` become one `CLAUDE.md`. Converting back yields one `.mdc` file, not three. a16n warns about this when it happens.

Users should understand: **a16n is lossy in edge cases**. It optimizes for the common case (moving your setup to a new tool) not round-trip fidelity.

## Success Metrics

1. **Adoption**: Downloads, GitHub stars, community plugins
2. **Conversion success rate**: % of conversions completing without errors
3. **User satisfaction**: Do users successfully onboard to new tools faster?
4. **Ecosystem growth**: Number of third-party plugins for additional agents

## Target Users

**Primary**: Individual developers using AI coding tools who want to switch or try alternatives.

**Secondary**: Team leads standardizing on agent configurations across diverse tooling preferences.

**Tertiary**: Tool authors who want to make migration into their tool easy.

## Competitive Landscape

There is no direct competitor. This is greenfield tooling for an emerging problem space.

Adjacent tools:
- **dotfiles managers** (chezmoi, yadm): Manage config files but don't translate between formats
- **IDE settings sync**: Tool-specific, not cross-tool
- **AI prompt libraries**: Static content, not tool-integrated configuration

## Roadmap (Conceptual)

### v0.1 — Foundation
- Core conversion engine
- Cursor ↔ Claude Code plugins (bundled)
- CLI with basic `convert` command
- Warning system for lossy conversions

### v0.2 — Ecosystem
- Plugin discovery from npm
- Community plugin documentation
- Additional bundled plugins based on demand

### v0.3 — Workflows
- Config validation
- Diff output (show what would change)

### Future Considerations
- VS Code extension
- CI/CD integrations
- Config linting/best practices

---

*a16n: Take your agent customization anywhere.*
