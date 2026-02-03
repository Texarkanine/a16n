# Memory Bank: Product Context

## Problem Space
Development teams use multiple AI coding agents (Cursor, Claude Code, Codex, Windsurf). Each tool has its own customization format. Switching tools or using multiple tools means duplicating or losing carefully-crafted agent configurations.

## Target Users
1. **Primary**: Individual developers wanting to switch or try new AI coding tools
2. **Secondary**: Team leads standardizing agent configurations across diverse tooling
3. **Tertiary**: Tool authors wanting to ease migration into their tools
4. **Emerging**: OSS maintainers wanting to ship agent customization following AgentSkills.io

## User Stories
- **Developer Migration**: "I've used Cursor for 6 months with custom rules. My company got Claude Code licenses. I don't want to start over."
- **Team Consistency**: "Half my team uses Cursor, half uses Claude Code. We want shared coding standards."
- **OSS Maintainer**: "I want to ship agent customization with my library for any tool."
- **Multi-tool User**: "I use Cursor for some projects and Claude for others. I want my skills everywhere."

## Non-Goals
- Authoring tools for agent customization (use native tools)
- Real-time config sync
- Perfect round-trip fidelity (documented lossy conversions are acceptable)
- Replacing tool-specific documentation

## Success Metrics
- Adoption (downloads, stars, community plugins)
- Conversion success rate
- User satisfaction (faster tool onboarding)
- Ecosystem growth (third-party plugins, AgentSkills.io adoption)
