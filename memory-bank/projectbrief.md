# Memory Bank: Project Brief

## Project Name
**a16n** - Agent customization portability for AI coding tools

## Overview
a16n is a CLI tool and library that translates agent customization between coding tools (Cursor, Claude Code, etc.). It enables developers to take their carefully-crafted agent rules anywhere.

## Core Value Proposition
- Convert Cursor rules to Claude Code config (and vice versa)
- Preserve investment in agent customization when switching or using multiple tools
- Enable teams to maintain one source of truth for agent behavior

## Key Documents
- `README.md` - Quick start and package overview
- `planning/ROADMAP.md` - Development phases and future plans
- `planning/PHASE_*_SPEC.md` - Phase specifications

## Project Structure
```
a16n/
├── packages/
│   ├── models/          # @a16njs/models - IR types + plugin interface
│   ├── engine/          # @a16njs/engine - Conversion orchestration
│   ├── cli/             # a16n - CLI package (v0.6.0)
│   ├── plugin-cursor/   # @a16njs/plugin-cursor
│   ├── plugin-claude/   # @a16njs/plugin-claude
│   ├── glob-hook/       # @a16njs/glob-hook - Glob matcher for hooks
│   └── docs/            # Docusaurus documentation site
├── planning/            # Specifications and roadmap
└── memory-bank/         # Memory Bank system
```

## Upcoming Work
- **Phase 9**: IR Serialization Plugin (`@a16njs/plugin-a16n`, plugin ID: `'a16n'`)
- **Phase 10**: MCP Configuration Support
