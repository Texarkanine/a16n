---
"a16n": minor
"@a16njs/plugin-cursor": minor
"@a16njs/plugin-claude": minor
---

Add AgentIgnore bidirectional support and CLI polish

Phase 3 implementation:
- Cursor plugin: `.cursorignore` discovery and emission
- Claude plugin: `permissions.deny` Read rules discovery and emission
- Bidirectional conversion between `.cursorignore` ↔ `permissions.deny`
- CLI `--verbose` flag for debugging output
- Improved warning formatting with icons and hints (chalk)
- Improved error messages with suggestions
