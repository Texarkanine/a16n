# TASK ARCHIVE: skill-invocation-name-preservation

## METADATA
- **Task ID:** skill-invocation-name-preservation
- **Date Completed:** 2026-02-19
- **Complexity:** Level 3 (multi-package feature)
- **Branch:** `skill-naming`
- **PR:** https://github.com/Texarkanine/a16n/pull/64

## SUMMARY

Preserve skill invocation names (the directory name used for slash-commands, e.g. `/banana`) through discovery, IR serialization, and conversion across all plugins. Two problems were fixed: (1) discovery was flat-only, missing nested skill layouts like `veggies/tomato/SKILL.md`; (2) `SimpleAgentSkill` had no `name` field, so the invocation name was lost during conversion (e.g. cursor -> claude produced `.claude/skills/skill/` instead of `.claude/skills/banana/`).

## REQUIREMENTS

1. Nested skill directories must be discovered recursively by both cursor and claude plugins
2. Skill invocation name (directory name) must be preserved end-to-end: discover -> IR -> emit
3. `SimpleAgentSkill.name` must be a required field
4. IR version bumped to v1beta2; v1beta2 reader backward-compatible with v1beta1 files (name derived from filename when missing)

## IMPLEMENTATION

### Model Changes
- **`types.ts`:** Added required `name: string` to `SimpleAgentSkill` (invocation name)
- **`version.ts`:** `CURRENT_IR_VERSION` bumped to `v1beta2`
- **`format.ts`:** Serialize `name` for SimpleAgentSkill
- **`parse.ts`:** Deserialize `name`; derive from filename for v1beta1 files without name

### Discovery Changes
- **Cursor discover:** Recursive `findSkillDirs` with `SkillDirInfo { relativePath, dirName }`; set `name` from directory (skills) or filename (Phase 2 rules)
- **Claude discover:** Recursive `findSkillDirs`; set `name` from directory

### Emit Changes
- **Claude emit / Cursor emit / a16n emit:** Use `skill.name` for output directory or IR filename

### CodeRabbit Follow-up (PR #64 review)
- 16 actionable items addressed across 3 commits (b68b5f3, 063603c, 25f289c)
- Key fixes: whitespace trimming, metadata undefined guards, test fixture name fields, JSDoc updates, warning message alignment

## TESTING

- **Unit tests:** cursor discover (name + recursive), claude/a16n emit (name-based dir), a16n parse (filename and name in IR)
- **Integration tests:** cursor->claude name preservation, nested discovery
- **Version expectations:** Updated across all test suites for v1beta2
- All tests passing at completion

## LESSONS LEARNED

1. **Schema/IR changes:** Decide required vs optional and plan the version bump before coding to avoid follow-up passes.
2. **Model-first approach:** Adding `name` to the type and IR first made the "name required" tightening a small, local change later.
3. **Unified recursion rule:** "Directory with `SKILL.md` = skill, else recurse" — same rule in both plugins kept behavior predictable.
4. **Test data checklist:** For new required fields on shared types, enumerate all constructors/fixtures/test objects up front to minimize iterative fixup.

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-skill-invocation-name-preservation.md` (archived)
- **Previous archive:** `memory-bank/archive/features/20260215-plugin-discovery.md` (related: plugin discovery wiring)
