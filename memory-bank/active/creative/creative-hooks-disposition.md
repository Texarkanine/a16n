# Decision: `hooks:` Disposition — Hard Skip or Advisory Warning?

## Context

**What**: When a Claude skill declares `hooks:`, should discovery continue to hard-`Skipped` it (status quo), or downgrade it to the `Approximated` advisory that this task introduces for every other Category-A feature?

**Why it matters**: The operator explicitly asked for this to be reconsidered, and it is the one place where the task's own thesis could over-rotate. The whole point of the work is "stop hard-skipping content that is still representable" — and by that logic `hooks:` looks like the next domino. Getting this wrong in either direction is costly: keeping an unjustified skip perpetuates #142's mistake on the Claude side, while removing a justified one silently weakens users' security posture. The decision cascades into `systemPatterns.md`, the `AgentSkillIO` doc comment in `models/src/types.ts`, and three existing test assertions.

**Constraints**

1. Must be consistent with `systemPatterns.md`'s warn-and-continue philosophy: *fail fast on invalid input, warn and continue on capability gaps.*
2. Must respect `WarningCode` semantics: `Skipped` = "Feature was not supported and omitted"; `Approximated` = "Feature was translated imperfectly."
3. Must not silently weaken a security posture the skill author explicitly specified.
4. Whatever rule is chosen must be **general** — future Claude features need to be classifiable without re-litigating this.

## Options Evaluated

- **Option A — Keep hard `Skipped` for all hooks**: status quo, but justified by an explicit principle rather than inheritance.
- **Option B — Downgrade all hooks to `Approximated`**: uniform treatment with every other Category-A feature.
- **Option C — Per-event triage**: `Skipped` for blocking events (`PreToolUse`, `UserPromptSubmit`), `Approximated` for observational ones (`PostToolUse`, `Stop`, `Notification`).
- **Option D — Configurable**: a flag letting the user choose skip-vs-warn.

## Analysis

| Criterion | A: Keep skip | B: Uniform warn | C: Per-event | D: Configurable |
|---|---|---|---|---|
| Safety | Fails closed | **Fails open** on deny-hooks | Fails closed where it matters | Depends on user |
| Simplicity | Highest — no new logic | Highest | Low — encodes Claude's event taxonomy, which drifts | Lowest — new surface area |
| Consistency w/ task thesis | Apparent tension, resolvable | Perfect | Partial | Evasive |
| Reversibility | High | High | High | Low — flags are forever |
| Scope of impact | Zero — no test churn | 3 test assertions + 2 docs | Same as B plus taxonomy | Same plus CLI/docs |

The project's own test fixture makes the stakes concrete:

```yaml
name: secure-operations
description: Perform operations with security checks
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
```

with the body *"Run security checks before bash commands. Validate all user input before execution."*

Under Option B this converts successfully into a skill that still **claims** to enforce security checks, while the `PreToolUse` gate that actually enforced them has evaporated. The user gets a warning at conversion time and an artifact that lies about itself forever after.

Key insights:

- **The real discriminator is not "hooks vs. everything else" — it is whether the loss is visible in the output.** A lost `$ARGUMENTS` leaves a literal `$ARGUMENTS` sitting in the converted body: self-evidently broken, discoverable by anyone who reads the file. A lost `hooks:` block leaves a clean, ordinary-looking skill. Invisible degradation cannot be caught downstream, so it must be caught at the gate.
- **Sharpening that further gives the general rule Constraint 4 demands**: the dividing line is *loss that silently removes a restriction the author specified* versus *loss that visibly breaks a substitution*. The first must fail closed; the second can fail open. This is a rule future features can be classified against without reopening the question.
- **The apparent tension with the task thesis dissolves under that rule.** The thesis is "don't skip content that is fine" — not "never skip." #142's gate was wrong because the content it dropped was completely fine. A deny-hook is not fine.
- **The rule is asymmetric in a way that survives scrutiny.** Losing `allowed-tools` (Category B) makes the artifact *more* restrictive — safe to warn about. Losing a `PreToolUse` deny-hook makes it *less* restrictive — not safe.
- **`disallowed-tools` is the closest call** and worth recording. It also removes a restriction, which points at `Skipped`. It lands on `Approximated` because its restriction is explicitly single-turn ("clears when you send your next message"), it executes no code, and it cannot remove `EndConversation` — so the residual risk is materially smaller than an arbitrary-command hook. Flagged here so the next reader sees it was considered, not overlooked.
- **Option C is over-engineering.** It buys a marginally narrower skip in exchange for hard-coding Claude's hook-event taxonomy — which has grown repeatedly (`SessionStart`, `SessionEnd`, `PreCompact`, `SubagentStop`) and would silently mis-triage any event added after this code is written. A new blocking event would default to the *unsafe* side. YAGNI, and unsafe-by-default when wrong.
- **Option D is bikeshedding-as-a-feature.** It converts a decision we are equipped to make into permanent configuration surface.

## Decision

**Selected**: Option A — keep `hooks:` as a hard `Skipped`.

**Rationale**: Hooks are the one Category-A feature whose loss is both invisible in the converted artifact and capable of removing an author-specified safety restriction. `WarningCode.Skipped` ("not supported and omitted") describes this accurately, while `Approximated` ("translated imperfectly") would not — nothing about a silently-disarmed security gate is a translation. Keeping the skip also means zero churn in existing tests and documentation, so the task's blast radius stays on the change that actually needs making.

**Tradeoff**: Accepts that a skill whose only hook is benign — a `PostToolUse` formatter, say — is skipped more aggressively than strictly necessary. That is the deliberate fail-closed cost, and it is bounded: the user gets an explicit warning naming the skill and can hand-convert it. Option C would recover those cases only by adopting a taxonomy that fails unsafely as Claude adds events.

## Implementation Notes

- **No change** to the existing `hooks:` skip in `packages/plugin-claude/src/discover.ts` (~line 408), its message, or the three assertions in `discover-simple-agent-skill.test.ts:51` and `discover-agent-skill-io.test.ts:29,173`.
- **No change** to the Claude classification priority order in `memory-bank/systemPatterns.md` or the `AgentSkillIO` doc comment in `packages/models/src/types.ts` — both already describe the retained behavior.
- Hooks stay **excluded** from the new `detectNonSpecFeatures()` result set: the skill is skipped before advisory detection runs, so it must not also produce an `Approximated` warning. Pin this with a test — a hooks skill yields exactly one `Skipped` warning and no `Approximated` one.
- `disallowed-tools` is detected as a normal Category-A frontmatter key on the `Approximated` side.
- Record the general rule — *restriction-removing and invisible → fail closed; substitution-breaking and visible → fail open* — in the code comment above the skip, so the next person adding a Claude feature has the classifier to hand.
