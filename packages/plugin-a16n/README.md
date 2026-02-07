# @a16njs/plugin-a16n

[![npm version](https://img.shields.io/npm/v/@a16njs/plugin-a16n.svg)](https://www.npmjs.com/package/@a16njs/plugin-a16n)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=plugin-a16n)](https://codecov.io/gh/Texarkanine/a16n)

This plugin enables reading and writing the a16n intermediate representation to/from disk in a human-readable, git-friendly format with versioned schema support.

## Features

- **Versioned Schema**: Kubernetes-style versioning (e.g., `v1beta1`) for forward compatibility
- **Human-Readable**: Markdown files with YAML frontmatter
- **Git-Friendly**: Text-based format optimized for version control

## Usage

### Reading IR Files

```bash
# Discover IR files from .a16n/ directory
a16n discover --from a16n .

# Convert from IR to another format
a16n convert --from a16n --to cursor .
a16n convert --from a16n --to claude .
```

### Writing IR Files

```bash
# Convert from another format to IR
a16n convert --from cursor --to a16n .
a16n convert --from claude --to a16n .
```

## Directory Structure

The plugin reads/writes files in the `.a16n/` directory:

```
.a16n/
├── global-prompt/
│   ├── coding-standards.md
│   └── security-rules.md
├── file-rule/
│   └── typescript-style.md
├── simple-agent-skill/
│   └── code-review.md
├── agent-skill-io/
│   └── deploy-helper/
│       ├── SKILL.md
│       └── resources/
├── agent-ignore/
│   └── build-artifacts.md
└── manual-prompt/
    └── generate-tests.md
```

## File Format

Each IR file contains YAML frontmatter with metadata and markdown content:

```markdown
---
version: v1beta1
type: global-prompt
relativeDir: shared/standards
---

# Coding Standards

Always follow these coding standards...
```

### Frontmatter Fields

- `version` (required): IR version (e.g., `v1beta1`)
- `type` (required): CustomizationType enum value (kebab-case)
- `relativeDir` (optional): Relative directory path for preserving structure
- Type-specific fields (e.g., `globs` for FileRule, `description` for SimpleAgentSkill)

**Note**: The filename serves as the item's identifier; no separate `name` field is needed in frontmatter.

## Version Compatibility

The plugin enforces forward compatibility:

- Readers with version `v1beta2` can read files with `v1beta1`
- Major version must match (v1 != v2)
- Stability must match (beta != alpha != stable)
- Files with incompatible versions emit warnings but are processed

## Plugin ID

**Plugin ID**: `'a16n'`

Use this ID with CLI commands:
- `--from a16n`: Read from `.a16n/` directory
- `--to a16n`: Write to `.a16n/` directory

## Development Status

**Current Version**: 0.1.0

- ✅ M1: IR Model Versioning & Extensions
- ✅ M2: Plugin Package Setup
- ✅ M3: Frontmatter Parsing & Formatting
- ✅ M4: IR Emission + CLI Integration
- ✅ M5: IR Discovery
- ✅ M6: E2E Integration Testing
- ✅ M7: Documentation & Cross-Format E2E Tests

## License

AGPL-3.0

## Links

- [Homepage](https://texarkanine.github.io/a16n/plugin-a16n)
- [Repository](https://github.com/Texarkanine/a16n)
- [Issues](https://github.com/Texarkanine/a16n/issues)
