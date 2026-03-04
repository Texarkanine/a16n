# Product Context

## Target Audience

1. **Individual developers** wanting to switch between or try new AI coding tools without losing their carefully-crafted agent configurations
2. **Team leads** standardizing agent configurations across teams that use diverse tooling
3. **Tool authors** wanting to ease migration into their tools from competing products
4. **OSS maintainers** wanting to ship agent customization with their libraries in a tool-agnostic format

## Use Cases

- **Tool migration**: A developer with months of Cursor rules gets Claude Code licenses and needs to bring their configuration along
- **Multi-tool teams**: Half the team uses Cursor, half uses Claude Code; the team wants shared coding standards regardless of tool
- **Library distribution**: An OSS maintainer ships agent customization that works with any supported tool
- **Tool evaluation**: A developer wants to try a new tool without the cost of manually recreating their configuration
- **Canonical IR storage**: A team uses the `a16n` IR format as a single source of truth, emitting to whichever tool each member uses

## Key Benefits

- Eliminates manual re-creation of agent customization when switching tools
- Enables a single source of truth for team coding standards across heterogeneous tooling
- Lowers the barrier to adopting or evaluating new AI coding tools
- Provides a plugin architecture that can grow to support new tools as they emerge
- The `discover` command lets users audit their existing configurations without converting

## Success Criteria

- Conversion success rate: supported customization types convert correctly between tools
- Adoption: downloads, GitHub stars, community-contributed plugins
- User satisfaction: measurably faster tool onboarding
- Ecosystem growth: third-party plugins

## Key Constraints

- No authoring tools for agent customization — users author in native tool formats
- No real-time configuration sync
- Perfect round-trip fidelity is a non-goal; documented lossy conversions are acceptable
- Must not replace or compete with tool-specific documentation
