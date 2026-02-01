# Memory Bank: Active Context

## Current Focus

**Task**: DOCS-CLEANUP-R2 - Documentation Cleanup Round 2
**Phase**: Planning Complete → Ready for Implementation
**Complexity**: Level 2

## Problem Statement

Post-review feedback identified several issues:
1. CLI versioned docs not generating (warning: "No docs found in cli/reference")
2. Plugin-to-plugin conversion tables don't scale
3. Models page has tool-specific info that belongs elsewhere
4. Plugin pages replicate canonical tool documentation

## Key Decisions

1. **CLI Docs**: Add CLI to versioned generation pipeline using `generateCliDocsForVersion()`
2. **Conversion Tables**: Remove - they create N×N documentation burden
3. **API Linking**: Punt on version-specific linking - too complex to maintain
4. **Plugin Pages**: Link to canonical docs (cursor.com, anthropic.com) instead of replicating

## Guiding Principle

Document internal IR types (GlobalPrompt, AgentSkill, etc.) as the stable reference point. Avoid documenting plugin-to-plugin conversion details since:
- With 2 plugins: 4 conversion paths (N×N)
- With 3 plugins: 9 conversion paths
- This doesn't scale

Instead, users should use `--dry-run` to understand specific conversions.

## Next Steps

Ready to begin Phase 1: CLI Versioned Docs
