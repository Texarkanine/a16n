---
task_id: naming-fix
date: 2026-02-23
complexity_level: 3
---

# Reflection: GlobalPrompt Name Field — Complete Implementation

## Summary

Made `GlobalPrompt.name` a required field across the a16n plugin ecosystem, backed by a shared `inferGlobalPromptName(sourcePath)` utility that correctly handles leading-dot filenames. The fix eliminates a class of "re-derive at emit time" bugs (including the root cause: `.cursorrules` → `rule.mdc` instead of `cursorrules.mdc`) and enforces the invariant at every construction site via TypeScript. All 849 tests pass with zero `as any` casts.

## Requirements vs Outcome

All 6 planned phases were delivered completely:

- `inferGlobalPromptName` utility in `@a16njs/models` — implemented and exported ✅
- `GlobalPrompt.name: string` required (not optional) ✅
- All discovery plugins set `name` at discovery time (plugin-a16n, plugin-cursor, plugin-claude, cursorrules plugin) ✅
- All emission plugins use `gp.name` directly (plugin-a16n, plugin-cursor, plugin-claude) ✅
- Full monorepo suite: 849 tests passing ✅
- Zero `as any` in any a16n plugin ✅

No requirements were dropped, descoped, or added during build. The plan and the outcome aligned.

## Plan Accuracy

The plan was accurate in scope and sequence. One technical surprise during Phase 4 (plugin-claude):

**TypeScript build error**: `TS2353: Object literal may only specify known properties, and 'name' does not exist in type 'AgentCustomization'`

When pushing an object literal to `items: AgentCustomization[]`, TypeScript performs excess property checking against the union base type — it doesn't narrow on the discriminant inside the object literal. The plan anticipated `as GlobalPrompt` casts might be needed ("Fix TypeScript errors (test fixtures, etc.)"), but the specific mechanism wasn't fully predicted. The fix was clean: `as GlobalPrompt` (not `as any`) — type-safe, correct.

Everything else matched: file list, phase sequence, IR roundtrip analysis, the `sanitizeFilename` observation in advisory QA findings.

## Creative Phase Review

No creative phase was executed, which was correct. The approach was well-reasoned during planning — the "required field + shared utility + discovery-time assignment" pattern was clear and had no competing alternatives worth exploring. Skipping creative did not create any build-phase friction.

## Build & QA Observations

**What went smoothly:**
- Phases 1-3 and Phase 6 were clean — no surprises, no errors.
- TDD discipline paid off: seeing the 3 expected failures in plugin-claude (Phase 4) before implementing confirmed the tests were correctly targeting the right behavior.
- The workspace link (`file:../a16n/packages/models`) in `a16n-plugin-cursorrules` meant Phase 6 picked up framework changes without a publish step — zero friction.

**Where we iterated:**
- Phase 4 TypeScript error required diagnosis (described above). One iteration: identified mechanism, applied `as GlobalPrompt`, re-ran build, clean.

**QA findings:**
- No blocking findings. One advisory: `sanitizeFilename()` parameter still named `sourcePath` but now called with `gp.name`. Cosmetic — function still works correctly since `gp.name` is already a clean stem with no path separators or extensions.

## Cross-Phase Analysis

**Prior work → replan**: The "stranger's" prior implementation had `name?: string` (optional) with `as any` cast and hardcoded `'cursorrules'`. QA on that implementation correctly flagged it as incomplete (plugin-claude was not updated). The decision to replan rather than patch was correct — the `as any` was a symptom that the type system wasn't properly expressing the invariant. Making `name: string` required eliminated the entire category of "what if name is missing" defensive handling.

**Plan → build**: The plan's IR roundtrip analysis ("name is NOT serialized to IR frontmatter; the IR filename IS the name") was exactly right. `plugin-a16n`'s `parseIRFile` already computed `nameWithoutExt` from the filename — adding `name: nameWithoutExt` to the GlobalPrompt case was a one-line change. No surprises.

**Planning precision prevented scope creep**: The plan's "Out of Scope" section (Claude plugin CLAUDE.md single-file optimization; subdirectory GlobalPrompts with `paths:`) was referenced during the post-QA scope reassessment. That explicit boundary kept the task focused and allowed confident confirmation that no future paths were blocked.

## Insights

### Technical

- **TypeScript union type discrimination doesn't narrow object literals pushed into typed arrays**: Pushing `{ type: CustomizationType.GlobalPrompt, name: ... }` to `AgentCustomization[]` triggers excess property checking against the union base, not the narrowed discriminant type. Fix: explicit `as ConcreteType` cast at the push site (not `as any`). This pattern will recur any time a new field is added to a discriminated union member and pushed to a base-typed array.

- **Leading-dot file naming in Node.js**: `path.extname('.cursorrules')` returns `''` — Node treats the whole string as a stem with no extension. `path.basename('.cursorrules')` = `'.cursorrules'` (no stripping). Both standard path utilities fail for leading-dot files without pre-processing. `inferGlobalPromptName` correctly strips the leading dot first, then strips the extension from the remainder. Any future file-to-name derivation for dot-prefixed files needs this pattern.

- **"Required field" is strictly better than "optional field" for invariants enforced at consuming sites**: When every caller must supply a value and every consumer can assume it's present, `name: string` is the correct type. `name?: string` forces defensive `?` and `||` handling at every consumer without actually preventing omission at construction sites. The optional field pattern (from `SimpleAgentSkill.name?: string`) was the wrong model to follow for `GlobalPrompt`.

### Process

- **QA as a gate on prior work before extending it**: A partial prior implementation was subjected to QA before deciding whether to extend or replan. QA correctly identified the incompleteness, which triggered a clean replan. This is better than inheriting a flawed foundation and patching it.

- **Explicit "Out of Scope" in the plan pays dividends**: The tasks.md "Out of Scope (Future Work)" section was directly useful during the post-QA scope reassessment — it provided the vocabulary and reasoning to quickly confirm no future paths were blocked. Time spent on explicit descoping during planning = time saved during QA review.

- **Cross-repo workspace links enable Phase 6 without publish friction**: `file:../a16n/packages/models` means `a16n-plugin-cursorrules` always gets the local build of models. For development, this is a significant workflow advantage — Phase 6 was executable immediately after Phase 5 without waiting for npm publish. Worth documenting as a "works because of workspace link" assumption so future developers don't break it by switching to a pinned version prematurely.
