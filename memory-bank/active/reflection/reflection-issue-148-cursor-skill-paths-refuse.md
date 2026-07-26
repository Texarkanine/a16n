---
task_id: issue-148-cursor-skill-paths-refuse
date: 2026-07-26
complexity_level: 2
---

# Reflection: Refuse conversion of Cursor skills with `paths:`

## Summary

Cursor skills declaring harness-specific `paths:` are now refused at discovery (`Skipped`, no IR item), so conversion cannot silently widen skill scope. Delivered as planned for [#148](https://github.com/Texarkanine/a16n/issues/148).

## Requirements vs Outcome

All brief requirements met: detect `paths:`, refuse (not WARN-and-emit), clear warning, unaffected skills unchanged. No IR survival of `paths:` (explicitly out of scope). No requirements dropped or added beyond the preflight CLI integration case.

## Plan Accuracy

Plan sequence and file list held. Preflight correctly forced TDD ordering for the CLI test. The main challenge (refuse vs Skipped-with-emit) was avoided by mirroring Claude `hooks:` exactly. No surprises in fixtures — none already used skill `paths:`.

## Build & QA Observations

Build was a near-port of Claude's `hasHooks` control flow. QA only caught a placement nit (`hasPaths` on `ParsedSkill` vs `SkillFrontmatter`); fixed trivially. Full suite green before QA; targeted retests green after.

## Insights

### Technical
- For Category A harness fields that would *widen* behavior if dropped, discover-skip is the right refuse shape; emit-side Skipped-with-bytes (allowed-tools) is a different safety question.

### Process
- When a sibling plugin already encodes the disposition, copy its field placement in the first draft to skip QA style nits.

### Million-Dollar Question

If `paths:` had been a foundational IR concept from day one, Cursor skills would carry portable file-scoping (or an explicit harness-extension bag) and cursor→cursor would round-trip. Given Category A and refuse-only acceptance, the discover-skip we shipped is the elegant solution *for this constraint* — modeling can wait for a survival design.
