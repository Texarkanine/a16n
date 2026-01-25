# a16n

## 0.1.0

### Minor Changes

- eba0dd4: Add AgentIgnore bidirectional support and CLI polish

  Phase 3 implementation:

  - Cursor plugin: `.cursorignore` discovery and emission
  - Claude plugin: `permissions.deny` Read rules discovery and emission
  - Bidirectional conversion between `.cursorignore` ↔ `permissions.deny`
  - CLI `--verbose` flag for debugging output
  - Improved warning formatting with icons and hints (chalk)
  - Improved error messages with suggestions

### Patch Changes

- Updated dependencies [eba0dd4]
  - @a16njs/plugin-cursor@0.1.0
  - @a16njs/plugin-claude@0.1.0
  - @a16njs/engine@0.0.1
