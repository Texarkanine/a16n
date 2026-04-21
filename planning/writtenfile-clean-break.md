# Planning: `WrittenFile` clean-break refactor (1.0)

**Status:** Punchlist for a future Level 3 task. **Not** exhaustively planned — this document captures research findings and gotchas so we don't re-derive them when we pick this up.

**Context origin:** surfaced during preflight of [20260420-skills-docs-and-rewrite-resources](../memory-bank/active/tasks.md) while investigating `--rewrite-path-refs` for AgentSkillIO ride-along files. The task-scoped fix adds an optional `sourcePaths?: string[]` field with a `sourceItems`-based fallback. This document plans the follow-up refactor that removes the fallback and cleans up the public contract.

**Prerequisite:** task 20260420 shipped and stable for at least one release cycle. Don't open this until the additive fix has proven itself.

---

## The core finding

Every current consumer of `WrittenFile.sourceItems` reads **only `.sourcePath`** from each item. Nothing reads `.type`, `.content`, `.globs`, `.files`, or any other IR field. Verified sites (line numbers accurate as of the task 20260420 preflight):

| Consumer | File | Lines | What's read |
|---|---|---|---|
| Path-rewriter `buildMapping` | `packages/engine/src/path-rewriter.ts` | 53–60 | `sourceItem.sourcePath` only |
| `--delete-source` | `packages/cli/src/commands/convert.ts` | 511–518 | `item.sourcePath` only |
| Git-ignore match mode | `packages/cli/src/commands/convert.ts` | 312–330 | `source.sourcePath` only |
| Git-status conflict warning | `packages/cli/src/commands/convert.ts` | 459–470 | `sources.map(s => s.sourcePath)` |

**`sourceItems` is, in practice, a `string[]` of paths carried inside an `AgentCustomization[]`.** The rich IR object is never examined. This is a leaky abstraction across three consumers, not just one.

---

## Decision still open: Flavor A vs Flavor B

Pick one when re-planning. The choice drives scope.

- **Flavor A — "Radical":** Both `sourcePaths` and `sourceItems` become **required** fields. Split of concerns: `sourcePaths` for routing, `sourceItems` for attribution (future-proof in case a consumer legitimately needs richer item context). Keep `itemCount` or drop it (redundant with `sourcePaths.length`).
- **Flavor B — "YAGNI":** Drop `sourceItems` entirely; `sourcePaths` is the only field. Any consumer that needs the rich item looks it up in the engine's `discovered: AgentCustomization[]` via a `Map<sourcePath, AgentCustomization>`. Also drop `itemCount`.

**Leaning toward B** — evidence shows no consumer needs the item; pre-1.0 is the cheapest moment to delete. But decide during re-planning after reviewing any third-party plugins that have appeared in the interim.

---

## Gotcha: AgentSkillIO resource files have no IR item

Resource files (`.cursor/skills/foo/scripts/bar.sh`) are **not** separate `AgentCustomization` instances — they're embedded in the parent skill's `files: Record<string, string>` map. This means:

- `sourcePaths` is a **strict superset** of paths-derivable-from-sourceItems. Some `sourcePaths` entries have no corresponding IR item.
- `sourceItems` is **not** derivable from `sourcePaths` alone in the 1:N case (resource file → parent skill requires knowing the skill structure).
- For Flavor B, consumers that look up "the item at this path" will legitimately get `undefined` for resource paths. This is fine for the current three consumers (none care) but is a contract every future consumer must handle.

---

## Gotcha: `buildMapping` has unused parameters

Current signature (`packages/engine/src/path-rewriter.ts:40-45`):

```typescript
buildMapping(
  _discovered: AgentCustomization[],  // unused — leading underscore
  written: WrittenFile[],
  _sourceRoot: string,                 // unused
  targetRoot: string,
): PathMapping
```

The major bump is the free moment to drop these. New signature:

```typescript
buildMapping(
  written: readonly WrittenFile[],
  targetRoot: string,
): { mapping: PathMapping; warnings: Warning[] }
```

Note the return type already changes in the task-20260420 minimal fix (to add the collision-warning lint) — Flavor A/B inherit that shape.

---

## Gotcha: `itemCount` is redundant today

```typescript
// packages/models/src/plugin.ts:25
itemCount: number;  // "How many models went into this file (1 for 1:1, more if merged)"
```

`itemCount === sourceItems.length` for every bundled-plugin call site. Remove in the major bump. No current consumer reads it except for display/logging, and those can use `sourcePaths.length`.

---

## Punchlist: package bumps

Lockstep major release, coordinated via Release-Please (`release.yaml`). Since `@a16njs/models` is at `0.12.0` today, this is the natural moment to cut **1.0** and stabilize the plugin contract.

| Package | Today | Bump | Scope of change |
|---|---|---|---|
| `@a16njs/models` | `0.12.0` | → `1.0.0` | Tighten `WrittenFile`: `sourcePaths` required, drop `itemCount`, drop `sourceItems` (Flavor B) or make required (Flavor A). Add `readonly` to all fields while we're there. |
| `@a16njs/engine` | monorepo | major | Simplify `buildMapping` signature (drop unused params). Collapse `buildMapping` body to single derivation path. Keep collision-warning lint from task 20260420. |
| `@a16njs/plugin-cursor` | monorepo | major | Populate `sourcePaths` on every WrittenFile (~8 sites in `emit.ts`). Flavor B: drop `sourceItems` from every push. Update tests in `test/emit.test.ts`. |
| `@a16njs/plugin-claude` | monorepo | major | Same as cursor, ~7 sites. |
| `@a16njs/plugin-a16n` | monorepo | major | Same, handful of sites. |
| `@a16njs/cli` | monorepo | major | Flavor B: replace all `written.sourceItems`/`source.sourcePath` loops with `written.sourcePaths` loops in `src/commands/convert.ts`. Removes ~40 lines including the "plugin does not provide source tracking" fallback. |
| `@a16njs/glob-hook` | monorepo | no change | Not on this call path. |
| `@a16njs/docs` | — | doc update | New migration guide; update `docs/plugin-author-guide` (if exists) and `docs/models/index.md`. |

---

## Punchlist: implementation steps (not exhaustive — re-plan these)

1. Add migration guide to `packages/docs/` before touching code — gives plugin authors advance notice during alpha/beta.
2. Update `@a16njs/models` `WrittenFile` interface; add `readonly`; drop chosen fields.
3. Update `@a16njs/engine` `buildMapping` signature + body.
4. Update each bundled plugin's `emit.ts`. Cursor first (has the AgentSkillIO fix pattern already if task 20260420 landed), then Claude, then a16n.
5. Update `@a16njs/cli` `convert.ts` consumers. This is where the biggest LOC reduction happens (Flavor B).
6. Update all `test/emit.test.ts` files to assert on `sourcePaths` instead of `sourceItems` (Flavor B).
7. Update `path-rewriter.test.ts` and `transformation.test.ts` for the new signatures.
8. Run the full validation suite. Also `pnpm --filter docs run docs:build:all`.
9. Release-Please coordination: all seven `@a16njs/*` packages bump together. Write clear CHANGELOG entries referencing the migration guide.

---

## Research notes: warning-code hygiene

Task 20260420's minimal fix uses `WarningCode.Approximated` for the collision-detection lint. That's a compromise — the warning is really aimed at plugin authors, not end users, which `Approximated` isn't quite designed for. The major bump is a good moment to either:

- Introduce a dedicated `WarningCode.AmbiguousSourceMapping` code (cleaner semantics, but more enum surface).
- Introduce a broader `WarningCode.PluginContract` umbrella code for any "your plugin is doing something wrong" warnings.

Decide during re-planning. Either way, the new code lands in `packages/models/src/warnings.ts`.

---

## Research notes: is `@a16njs/models` consumed by external plugins today?

`systemPatterns.md` says "Installed plugins (npm packages named `a16n-plugin-*`) are discovered at runtime." Unclear if any such npm packages exist in practice as of 2026-04-20. **Before re-planning**, search npm for `a16n-plugin-*` and check GitHub dependents of `@a16njs/models` to quantify external blast radius. If zero, the major bump is essentially free; if non-zero, the migration guide and communication plan matter more.

---

## Research notes: `@a16njs/models` package reality check

From `packages/models/package.json` (verified 2026-04-20):

- `"name": "@a16njs/models"`, `"version": "0.12.0"`
- Published with `"main": "./dist/index.js"`, `"files": ["dist"]`
- Public exports in `src/index.ts` include `WrittenFile`, `EmitResult`, `A16nPlugin`, `DiscoveryResult`

So yes — this is a genuine public contract change, not an internal refactor. Treat it accordingly (CHANGELOG, migration guide, semantic version bump).

---

## Explicitly out of scope

- Changes to IR types (`AgentCustomization`, `CustomizationType`). These already took a bump going from `v1beta1` → `v1beta2`; a further bump belongs in its own task.
- Any `A16nPlugin.discover()` contract changes. This refactor is purely emit-side.
- Changes to `Workspace` abstraction. Orthogonal.
- `@a16njs/glob-hook` is deliberately unaffected; it lives outside the conversion pipeline per `techContext.md`.

---

## When to pick this up

Trigger conditions (any one suffices):

1. Another bug like task 20260420 surfaces a new 1:N-emit pattern that forces yet another sourceItems workaround.
2. First credible third-party plugin appears and asks about the WrittenFile contract (indicator that we need to stabilize).
3. We're otherwise cutting `@a16njs/models` 1.0 for independent reasons.
4. Engineering capacity for a Level 3 task with ~15–20 files of coordinated change across 5+ packages.

Until one of those hits, the additive fix from task 20260420 is sufficient.
