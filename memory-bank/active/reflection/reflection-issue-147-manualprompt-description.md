---
task_id: issue-147-manualprompt-description
date: 2026-07-26
complexity_level: 2
---

# Reflection: Preserve authored description on ManualPrompt

## Summary

Optional `description` on `ManualPrompt` now survives discover → IR (`v1beta4`) → skill emit; synthesize `Invoke with /<name>` only when absent. Full suite green; matches [#147](https://github.com/Texarkanine/a16n/issues/147) acceptance.

## Requirements vs Outcome

Delivered as planned. Round-trip and preserve/synthesize behaviors covered. Cannot-carry satisfied via agentsmd `unsupported` (no write / no boilerplate) rather than a field-level Approximated warning — intentional per plan after #99 removed command emit.

## Plan Accuracy

Plan sequence and touchpoints were accurate. No reordering. The main foresight win was recognizing silent overwrite on carrying skill surfaces as the live bug, not restoring command emit.

## Build & QA Observations

Clean TDD cycles; worktree needed a one-time `pnpm install`. QA found nothing substantive.

## Insights

### Technical
- When emit asymmetry has already moved a type to a richer surface, fidelity bugs may be "overwrite on a surface that can carry the field" rather than "drop because the target cannot" — diagnose against current emit paths, not historical ones.

### Process
- Nothing notable

### Million-Dollar Question

If ManualPrompt had always been "skill-shaped IR with optional authored description + synthesize-when-absent," #143's AgentSkillSpecFields work and this change would have been one IR story. What we built is that shape for `description`; nothing more elegant was required for this scope.
