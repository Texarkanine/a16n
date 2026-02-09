# Active Context: `relativeDir` Nesting Support

## Current Focus
Level 3 Feature Implementation: `relativeDir` nesting across Cursor and Claude plugins

## Design Decisions Resolved
1. **`relativeDir` preserves full subdirectory path** — `shared/`, `local/`, `commit/`, etc. are user organizational directories and MUST be preserved as-is. No stripping.
2. **a16n plugin already correct** — no changes needed there
3. **Gap 2 (shared/local mismatch) was user error** — not a real gap, no fix needed
4. **No new dependencies** — purely internal plugin changes
5. **Filename collision tracking stays global** — safer, matches current behavior

## Implementation Order
1. Cursor Discover (set relativeDir on rules)
2. Claude Discover (set relativeDir on rules)  
3. Claude Emit (use relativeDir for nesting)
4. Cursor Emit (use relativeDir for nesting)
5. Integration verification

## Key Files
| File | Change |
|------|--------|
| `packages/plugin-cursor/src/discover.ts` | Compute + set `relativeDir` on rules |
| `packages/plugin-claude/src/discover.ts` | Compute + set `relativeDir` on rules |
| `packages/plugin-claude/src/emit.ts` | Use `relativeDir` for subdirectory emit |
| `packages/plugin-cursor/src/emit.ts` | Use `relativeDir` for subdirectory emit |
| `packages/plugin-cursor/test/discover.test.ts` | New assertions + deep nesting test |
| `packages/plugin-claude/test/discover.test.ts` | New nested rules test |
| `packages/plugin-claude/test/emit.test.ts` | Nesting emit tests |
| `packages/plugin-cursor/test/emit.test.ts` | Nesting emit tests |

## Next Step
Proceed to `/build` — Phase 1: Cursor Discover
