# Architecture Decision: Emit Disposition per Field and Target

## Requirements & Constraints

Once the IR models the four fields, each emit surface must decide what to do with them. The recorded disposition rule covers only part of the space:

> Loss that silently removes an author-specified restriction → fail closed (`Skipped`).
> Loss that visibly breaks a substitution → fail open (`Approximated`).

**Quality attributes, ranked**

1. **Never emit an artifact that is quietly more permissive than authored.** Stated as the core hazard in the issue itself.
2. **Preserve the author's bytes** — the recorded "preserve and report, never strip" principle.
3. **Report each loss exactly once** — the fire-alone rule from #142.
4. **Silence when nothing is lost** — a warning that names no loss is noise.

**Evidence gathered**

- **Cursor tolerates unknown frontmatter keys.** Cursor's own docs state it loads skills from `.claude/skills/` and `.codex/skills/` "for compatibility." Those files routinely carry Claude-only keys (`model:`, `allowed-tools:`, `argument-hint:`). A harness that ingests them cannot be rejecting unknown keys. Writing spec fields Cursor does not document is therefore inert, not corrupting.
- **`Skipped` does not mean "drop the item."** Verified in `handleDeleteSource()` (`packages/cli/src/commands/convert.ts`): a `Skipped` warning carrying the item's source path removes that path from the `--delete-source` set **while the item is still emitted**. So "emit the content, raise `Skipped`" is a real fail-closed posture — the authored original is protected from deletion.
- **The `.mdc` downgrade route strips everything.** `emitAgentSkillIO()` in `plugin-cursor/src/emit.ts` routes a resource-less, model-invocable `AgentSkillIO` to `.cursor/rules/<name>.mdc` via `formatAgentSkillMdc()`, whose frontmatter is `description:` alone. Reachable in practice via `.a16n` → cursor (the cursor and claude discoverers cannot produce a file-less `AgentSkillIO`, but `readAgentSkillIO()` can).
- **Invariant correction.** "Warnings name the spec, never a destination harness" is a *discover-side* rule, because `discover()` is target-unaware. Emit-side warnings already name targets (`"AgentIgnore approximated as permissions.deny"`). Emit warnings here may name the target.

## Components

Five emit surfaces, which differ on two independent axes — *can it carry the bytes?* and *does it honor the semantics?*

| Surface | Carries bytes? | Honors `allowed-tools`? |
|---|---|---|
| S1 `.claude/skills/*/SKILL.md` | Yes | **Yes** |
| S2 `.cursor/skills/*/SKILL.md` | Yes (unknown keys inert) | **No** |
| S3 `.cursor/rules/*.mdc` | **No** — fixed 3-key schema | No |
| S4 `.a16n/**` | Yes (it is the IR) | N/A — not a runtime |
| S5 `AGENTS.md` | N/A — whole skill already skipped + warned | N/A |

## Options Evaluated

- **A — Write everywhere possible, never warn**: treat all four as inert text.
- **B — Write everywhere possible, warn on every field a target does not document**: maximal reporting.
- **C — Behavior-keyed**: write wherever the surface can carry the bytes; warn only where something is actually lost, with the code chosen by *what* is lost.
- **D — Omit unsupported fields and warn**: strip what the target does not document.

## Analysis

| Criterion | A | B | C | D |
|---|---|---|---|---|
| Never quietly more permissive (Q1) | **Fails** — `allowed-tools` to Cursor passes silently | Passes | Passes | Passes |
| Preserve bytes (Q2) | Passes | Passes | Passes | **Fails** — strips recoverable content |
| Report once (Q3) | N/A | Passes | Passes | Passes |
| Silence when nothing lost (Q4) | Passes | **Fails** — warns on `license`, which no harness executes and which is written verbatim | Passes | Fails |
| Risk | Ships the reported bug | Warning fatigue trains users to ignore output | Requires per-field reasoning | Data loss |

Key insights:

- **The two axes are separable, and that is the whole design.** "Can the surface carry the bytes" decides *whether to write*; "does the target honor the semantics" decides *whether to warn*. A and B each collapse the axes — A by never warning, B by warning whenever the target's documented schema lacks the key — and both get cases wrong as a result.
- **`license` and `compatibility` have no runtime behavior in any harness, including Claude.** They are provenance and documentation. When written verbatim to a target that ignores unknown keys, *nothing is lost* — so warning about them fails Q4. This is where B breaks: it would report a loss that did not occur.
- **`allowed-tools` is the only field where the two axes disagree** (bytes carried, semantics not honored). That disagreement is exactly quality 1, and it is why the field gets the only fail-closed treatment.
- **S3 is a different failure than S2** and must not be conflated. On S2 the bytes survive and only enforcement is lost; on S3 the bytes themselves are gone. Same field, different loss, different warning.

## Decision

### Choice Pre-Mortem

- *Cursor actually rejects or mis-parses unknown frontmatter keys, making "write inert fields" corrupting rather than harmless* — **checked**: Cursor documents loading `.claude/skills/` and `.codex/skills/` directly, which are full of non-Cursor keys.
- *`Skipped` on a written field breaks something downstream that assumes `Skipped` means "no output"* — **checked**: `handleDeleteSource()` only subtracts from the deletion set; emission is independent. This is also the behavior [#144](https://github.com/Texarkanine/a16n/issues/144) argues *should* be relied on more, not less.
- *The `allowed-tools` warning fires on every cursor conversion and becomes noise* — **checked, bounded**: it fires only for skills that actually declare `allowed-tools`, which no current repository fixture does. It is opt-in by authorship.

**Selected**: Option C — behavior-keyed disposition.

| Field | S1 claude | S2 cursor SKILL.md | S3 cursor `.mdc` | S4 `.a16n` |
|---|---|---|---|---|
| `license` | write, silent | write, silent | dropped → `Approximated` | write, silent |
| `compatibility` | write, silent | write, silent | dropped → `Approximated` | write, silent |
| `metadata` | write, silent | write, silent (officially supported) | dropped → `Approximated` | write, silent |
| `allowed-tools` | write, silent | **write + `Skipped`** | dropped → **`Skipped`** | write, silent |

**Rationale**: It is the only option that satisfies Q1 and Q2 simultaneously while keeping Q4 — it warns exactly where something is genuinely lost and stays silent everywhere else.

**Tradeoff**: Disposition is per-field rather than uniform, so the rule cannot be stated as a one-liner and must be encoded in one place to avoid drift.

## Implementation Notes

- **One warning per item per surface, not per field.** Collect the affected fields, emit a single warning naming them, and escalate the code to `Skipped` if `allowedTools` is among them, otherwise `Approximated`. This preserves the fire-alone rule: each warning names a real, self-sufficient loss, and a skill losing three fields on the `.mdc` route produces one line, not three.
- **Encode the table once**, in a small module local to `plugin-cursor` (e.g. `src/skill-field-support.ts`) called by all three cursor emit surfaces. Do not promote it to `@a16njs/models`: `plugin-claude` needs none of it, so there is exactly one consumer. Promote only if a second appears — same reasoning that kept `detectNonSpecFeatures` local in #142.
- **Warning wording** names the target harness and the field, e.g. `Skill 'clean': 'allowed-tools' is preserved but Cursor does not enforce tool restrictions; the emitted skill is more permissive than the source`. Emit-side warnings may name the target (see invariant correction above).
- **`Skipped` warnings must carry the item's `sourcePath`** in `sources`, or the `--delete-source` protection this decision relies on does not engage.
- **S5 (AGENTS.md) unchanged** — the whole skill is already skipped with a warning; a field-level warning there would double-report.
