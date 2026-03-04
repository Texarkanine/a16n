---
task_id: naming-fix
complexity_level: 3
date: 2026-02-23
status: completed
---

# TASK ARCHIVE: GlobalPrompt Name Field — Complete Implementation

## SUMMARY

Made `GlobalPrompt.name` a required field across the a16n plugin ecosystem, backed by a shared `inferGlobalPromptName(sourcePath)` utility that correctly handles leading-dot filenames. The fix eliminates a class of "re-derive at emit time" bugs (including the root cause: `.cursorrules` → `rule.mdc` instead of `cursorrules.mdc`) and enforces the invariant at every construction site via TypeScript. All 849 tests pass with zero `as any` casts.

## REQUIREMENTS

- `inferGlobalPromptName` utility in `@a16njs/models` — implemented and exported.
- `GlobalPrompt.name: string` required (not optional).
- All discovery plugins set `name` at discovery time (plugin-a16n, plugin-cursor, plugin-claude, cursorrules plugin).
- All emission plugins use `gp.name` directly (plugin-a16n, plugin-cursor, plugin-claude).
- Full monorepo suite: 849 tests passing.
- Zero `as any` in any a16n plugin.

No requirements were dropped, descoped, or added during build. The plan and the outcome aligned.

## IMPLEMENTATION

**Prior work → replan:** A prior implementation had `name?: string` (optional) with `as any` cast and hardcoded `'cursorrules'`. QA on that implementation correctly flagged it as incomplete (plugin-claude was not updated). The decision to replan rather than patch was correct — the `as any` was a symptom that the type system wasn't properly expressing the invariant. Making `name: string` required eliminated the entire category of "what if name is missing" defensive handling.

**Plan → build:** The plan's IR roundtrip analysis ("name is NOT serialized to IR frontmatter; the IR filename IS the name") was exactly right. `plugin-a16n`'s `parseIRFile` already computed `nameWithoutExt` from the filename — adding `name: nameWithoutExt` to the GlobalPrompt case was a one-line change.

**Key implementation details:**
- **TypeScript:** When pushing an object literal to `items: AgentCustomization[]`, TypeScript performs excess property checking against the union base type — it doesn't narrow on the discriminant inside the object literal. Fix: explicit `as GlobalPrompt` cast at the push site (not `as any`).
- **Leading-dot files:** `path.extname('.cursorrules')` returns `''`; `path.basename('.cursorrules')` = `'.cursorrules'`. `inferGlobalPromptName` strips the leading dot first, then strips the extension from the remainder.
- **Creative phase:** Not executed; the "required field + shared utility + discovery-time assignment" pattern was clear with no competing alternatives. Skipping creative did not create any build-phase friction.

Phases 1–3 and 6 were clean. Phase 4 (plugin-claude) required one iteration for the TypeScript union narrowness issue. QA advisory: `sanitizeFilename()` parameter still named `sourcePath` but now called with `gp.name` — cosmetic.

## TESTING

- Full monorepo suite: 849 tests passing.
- TDD discipline: expected failures in plugin-claude (Phase 4) before implementing confirmed tests targeted the right behavior.
- Workspace link (`file:../a16n/packages/models`) in `a16n-plugin-cursorrules` allowed Phase 6 to pick up framework changes without a publish step.

## LESSONS LEARNED

- **TypeScript union type discrimination doesn't narrow object literals pushed into typed arrays:** Pushing `{ type: CustomizationType.GlobalPrompt, name: ... }` to `AgentCustomization[]` triggers excess property checking against the union base. Fix: explicit `as ConcreteType` cast at the push site (not `as any`). This pattern will recur when adding a new field to a discriminated union member pushed to a base-typed array.
- **Leading-dot file naming in Node.js:** Standard path utilities fail for leading-dot files without pre-processing. `inferGlobalPromptName` correctly strips the leading dot first, then the extension. Any future file-to-name derivation for dot-prefixed files needs this pattern.
- **"Required field" is strictly better than "optional field" for invariants enforced at consuming sites:** `name: string` is correct when every caller must supply a value and every consumer can assume it's present. `name?: string` forces defensive handling at every consumer without preventing omission at construction sites.
- **QA as a gate on prior work before extending it:** Subjecting a partial prior implementation to QA before extending or replanning led to a clean replan instead of inheriting a flawed foundation.
- **Explicit "Out of Scope" in the plan pays dividends:** The tasks.md "Out of Scope (Future Work)" section was used during post-QA scope reassessment to confirm no future paths were blocked.
- **Cross-repo workspace links:** `file:../a16n/packages/models` in `a16n-plugin-cursorrules` enables development without npm publish. Worth documenting so future developers don't break it by switching to a pinned version prematurely.

## PROCESS IMPROVEMENTS

- When evaluating prior work, run QA first to decide whether to extend or replan.
- Keep "Out of Scope" explicit in the plan for quick scope confirmation during QA.

## TECHNICAL IMPROVEMENTS

- Consider renaming `sanitizeFilename()` parameter from `sourcePath` to something like `stem` or `name` when the argument is `gp.name`, for clarity. Cosmetic only; behavior is correct.

## NEXT STEPS

None. Planning precision and explicit out-of-scope boundary kept the task focused; no blocked future paths.
