# Algorithm Decision: Body-Level Non-Spec Feature Detection

## Problem

Given a Claude `SKILL.md`, produce the set of Category-A (non-spec, unmodeled) features it uses, so discovery can emit one advisory warning naming them.

**Input**: parsed frontmatter (`Record<string, unknown>` from `gray-matter`) plus the body string (markdown, typically 1–50 KB).
**Output**: `string[]` of detected feature labels.

The problem splits cleanly in two:

- **Frontmatter keys** (`argument-hint`, `arguments`, `model`, `effort`, `context`, `agent`, `shell`, `disallowed-tools`, `user-invocable`, `hooks`) — *unambiguous*. `gray-matter` already yields structured keys; detection is exact key membership. No design decision here.
- **Body substitutions** (`$ARGUMENTS`, `$ARGUMENTS[N]`, `$N`, `$name`, `` !`cmd` ``, `${CLAUDE_*}`, `@path`) — *ambiguous*. This is the actual open question.

**Invariants**

1. Never mutate content — observe only.
2. Must not recreate the #142 false-positive class (`@reviewer`, `@coderabbitai`, `@author`).
3. Only Category-A features are reportable.
4. No new runtime dependency if avoidable.

**Scale**: dozens of files, tens of KB each, once per conversion. Performance is a non-constraint; correctness and clarity dominate.

## The insight that reframes the whole question

**The cost of a false positive here is categorically lower than it was in #142.**

In #142, an over-broad match caused a **hard skip** — the command vanished from the conversion and the user had to hand-wrap it. Destructive.

Here, a match produces a `WarningCode.Approximated` line. The skill still converts, its content is untouched, and the user reads one extra sentence. Advisory.

That asymmetry inverts the usual calibration. A false negative silently loses runtime behavior (the exact failure this feature exists to prevent); a false positive costs one line of noise. So detection should lean *slightly* permissive on genuinely ambiguous constructs — while still eliminating the egregious, zero-signal false positives like `@reviewer`, which produce pure noise and would rightly be read as "#142 all over again."

**A second finding constrains the design**: Claude does *not* exempt fenced code blocks from substitution. Its docs state substitution "runs once over the original file," and the only documented positional exemption is for `!` (`` KEY=!`cmd` `` stays literal). So a `$ARGUMENTS` inside a ```` ``` ```` fence genuinely *is* substituted by Claude. Stripping fences before scanning would therefore be *semantically wrong*, not merely conservative.

## Options Evaluated

- **Option A — Tightened regex on raw body**: one pass of per-feature regexes over the whole body, each shape-tightened. No parsing, no gating.
- **Option B — Markdown-aware scan**: tokenize the body, strip fenced blocks and inline code spans, then apply patterns to prose only.
- **Option C — Frontmatter-gated hybrid**: shape-tightened regexes, plus use declared frontmatter as a disambiguating signal for the constructs that collide with ordinary shell syntax.
- **Option D — Full substitution emulation**: reimplement Claude's substitution engine and report what it would have changed.

## Analysis

| Criterion | A: Raw regex | B: Fence-stripping | C: Gated hybrid | D: Full emulation |
|---|---|---|---|---|
| Correctness | Good, but `$1` collides with shell positionals | **Wrong** — under-reports; Claude substitutes inside fences | Best — matches documented semantics, disambiguates `$N` | Best in theory, unverifiable in practice |
| Simplicity | Highest | Moderate | High — regexes plus two booleans | Lowest |
| Reuse | Native `RegExp` | Needs a markdown tokenizer | Native `RegExp` + existing `gray-matter` parse | Bespoke |
| Maintainability | Good | Tokenizer coupling | Good — gates are explicit and testable | Poor |
| Time | O(n) | O(n) + parse | O(n) | O(n) multi-pass |
| Space | O(1) | O(n) for token stream | O(1) | O(n) |

Key insights:

- **Option B is disqualified on correctness, not cost.** It looks like the careful choice and is in fact the wrong one: fences are substituted by Claude, so exempting them manufactures false negatives in the highest-cost direction.
- **Option D is textbook over-engineering.** We need presence detection, not substitution. We never render the result, so emulating substitution buys nothing. YAGNI.
- **`$N` is the one construct that genuinely needs help from outside the regex.** `awk '{print $1}'` and `sed 's/x/$1/'` are common in agent skills, and the old gate's `\$[1-9]` matched exactly these — it is a direct ancestor of the #142 defect. No amount of local shape-tightening separates a shell positional from a Claude positional, because *they are lexically identical*. The only available discriminator is document-level context: does this skill take arguments at all? That is precisely what Option C's gating supplies, and it is why C beats A.
- **`@path` needs shape, not context.** `@reviewer` and `@src/utils.js` differ lexically, so a shape rule suffices.

## Decision

**Selected**: Option C — frontmatter-gated hybrid.

**Rationale**: It is the only option that is correct on `$N` (the construct that caused #142's ancestor bug) without being wrong on fences (Option B) or speculative (Option D). It adds no dependency, reuses the `gray-matter` parse already performed, and every gate is a plain boolean that a test can pin.

**Tradeoff**: Accepts a deliberate false negative on extensionless path references such as `@src/utils`, because that shape is indistinguishable from a scoped npm package like `@modelcontextprotocol/sdk` — a genuinely common string in coding-agent skills. Given the advisory cost model, a missed advisory on an ambiguous token beats a spurious one on a real package name.

## Implementation Notes

Detection rules, each independently testable:

| Feature | Rule | Rejects |
|---|---|---|
| `$ARGUMENTS`, `$ARGUMENTS[N]` | Literal match on `$ARGUMENTS` (optionally `[digits]`) | — (distinctive; near-zero FP) |
| `$N` positional | `\$[0-9]` **gated**: only reported when the skill shows another argument signal — `$ARGUMENTS` present in body, or `arguments:` / `argument-hint:` in frontmatter | `awk '{print $1}'` in a skill that takes no arguments |
| `$name` named arg | Only when `arguments:` is declared; match the declared names | Arbitrary `$word` |
| `` !`cmd` `` | Backtick-delimited after `!`, where `!` is at line start or immediately after whitespace (Claude's documented rule); also ` ```! ` blocks | `` done!`foo` `` — `!` follows a letter |
| `${CLAUDE_*}` | Literal `${CLAUDE_` prefix | — (distinctive) |
| `@path` | `@` at line start or after whitespace, followed by a token that either begins `./`, `../`, `/` **or** carries a file extension | `@reviewer`, `@coderabbitai`, `@author`, `foo@bar.com` (preceded by non-whitespace), `@modelcontextprotocol/sdk` (no extension) |

Integration points:

- Lives in a new `packages/plugin-claude/src/spec-compliance.ts`, exporting a pure function `detectNonSpecFeatures(frontmatter, body): string[]`. Pure and dependency-free, so it is unit-testable without filesystem fixtures and extractable to `@a16njs/models` later if Cursor ever needs it. Not extracted now — YAGNI.
- Called from `discoverSkills()` in `packages/plugin-claude/src/discover.ts`, after `parseSkillFrontmatter()` and before classification.
- `parseSkillFrontmatter()` currently discards all keys except four. It must retain the raw `data` object (or a computed key list) so frontmatter detection can see the non-spec keys.
- Emits a single `WarningCode.Approximated` per skill listing all detected features, worded against the AgentSkills.io spec.

Edge cases to pin in tests:

- Skill with zero non-spec features → **no** warning (silence is the common case and must stay silent).
- `@mention`-heavy prose (the #142 fixtures) → no warning.
- `awk '{print $1}'` with no argument signal → no warning; the same body **with** `argument-hint:` → warned.
- `` KEY=!`cmd` `` → no bash-injection warning.
- Multiple features in one skill → exactly one warning naming all of them.
