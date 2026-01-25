# Memory Bank: Project Brief

## Project Name
**a16n** - Agent customization portability for AI coding tools

## Overview
a16n is a CLI tool and library that translates agent customization between coding tools (Cursor, Claude Code, etc.). It enables developers to take their carefully-crafted agent rules anywhere.

## Core Value Proposition
- Convert Cursor rules to Claude Code config (and vice versa)
- Preserve investment in agent customization when switching tools
- Enable teams to maintain one source of truth for agent behavior

## Key Documents
- `README.md` - Mock specification (spec-driven development)
- `planning/PRODUCT_BRIEF.md` - Product vision and user stories
- `planning/TECH_BRIEF.md` - Technical architecture decisions
- `planning/ARCHITECTURE.md` - Detailed system design
- `planning/PHASE_1_SPEC.md` - Phase 1 implementation specification
- `planning/ROADMAP.md` - Development phases and milestones

## Technology Stack
- **Language**: TypeScript
- **Package Manager**: pnpm (workspaces)
- **Build Orchestration**: Turborepo
- **Versioning**: Changesets
- **Testing**: Vitest (planned)

## Project Structure (Planned)
```
a16n/
├── packages/
│   ├── models/          # @a16njs/models - Types + plugin interface
│   ├── engine/          # @a16njs/engine - Orchestration
│   ├── cli/             # a16n - CLI package
│   ├── plugin-cursor/   # @a16njs/plugin-cursor
│   └── plugin-claude/   # @a16njs/plugin-claude
└── planning/            # Specification documents
```

## Current Phase
**Pre-Implementation**: Spec-driven development phase. Planning documents complete, implementation not yet started.
