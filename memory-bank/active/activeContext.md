# Active Context

## Current Task: v1-release-rollout-m4
**Phase:** REFLECT COMPLETE

## What Was Done
- Advanced the L4 to Milestone 4 (Wave B) after confirming M3 (Wave A) is published: `@a16njs/models@1.0.0` and `@a16njs/glob-hook@1.0.0` are live on npm; RP PRs merged.
- Classified M4 as **Level 2** (coordinated multi-package release; release-config subsystem only; proven recipe; no design work).
- PLAN: full plan written to `tasks.md`. Promote engine + plugin-cursor + plugin-claude + plugin-a16n to 1.0.0 via `release-as`; remove spent M3 keys (models/glob-hook); one `fix(release):` commit touching all five package READMEs as the RP trigger.

## Decisions
- **agentsmd = patch bump, NO `release-as`** (operator-confirmed 2026-06-13). It's already `1.0.3`; forcing `1.0.0` would be a downgrade and violate invariant #7. Its published tarball pins `@a16njs/models@0.14.1`; the only reason to touch it is dependency hygiene — a patch bump (`1.0.3 → 1.0.4`) lets pnpm's publish rewrite re-pin it to `models@1.0.0`, avoiding two `models` majors in the post-M5 `a16n` CLI install tree. Not required by any invariant, but worth it on a fresh 1.0 line.
- No new unit test (release-config + docs change; existing `workspace-publish-invariant` + agentsmd `publish-shape` guards cover it; RP version output is operator merge-gated). Replicates the M3 precedent.

## Build Output
- Edited `release-please-config.json`: `release-as: "1.0.0"` on engine/plugin-cursor/plugin-claude/plugin-a16n; removed spent M3 keys from models/glob-hook; agentsmd left clean.
- Added `## Stability` notes to READMEs of engine, plugin-cursor, plugin-claude, plugin-a16n (1.0.0 promotion) and plugin-agentsmd (already-1.x stability note — the patch-bump trigger).
- Full suite green: build 8/8, test 17/17 (incl. `workspace-publish-invariant` + agentsmd `publish-shape`), typecheck 14/14. Source still `workspace:*`.
- Deliverable committed as `fix(release): Wave B …` (conventional type is load-bearing — a `chore:` would not cut the release; the M1-class trap).

## Reflection
- `memory-bank/active/reflection/reflection-v1-release-rollout-m4.md` written. Clean execution, no QA findings. Key insight: the missing RP `linked-versions` plugin is why every wave needs a per-package path-touch (the M1/M3/M4 through-line); M6 owns the elegant fix.
- Persistent files reconciled — no updates needed (release-config change doesn't invalidate productContext/systemPatterns/techContext).

## Next Step (operator)
- M4 sub-run is REFLECT COMPLETE. Operator action: open a PR titled `fix(release): Wave B — …` (squash-merge title drives Release-Please) from `fix-release.m4`. **Merge-gate:** the generated RP PR must bump engine/plugin-cursor/plugin-claude/plugin-a16n → 1.0.0 and plugin-agentsmd → 1.0.4 before merging. After merge + publish, run `/niko` to advance the L4 to M5 (Wave C: CLI → 1.0.0).
