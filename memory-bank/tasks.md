# TASK TRACKING

## Current Task: CodeRabbit PR #64 Fixes

**Status:** In Progress
**PR URL:** https://github.com/Texarkanine/a16n/pull/64
**Rate Limit Until:**
**Last Updated:** 2026-02-19T17:00:00Z

### Actionable Items
- [ ] ID: trim-name - Trim whitespace in parse.ts frontmatter.name check
- [ ] ID: name-prefix - Remove relativeDir prefix from name in cursor discover classifyRule
- [ ] ID: prompt-name - ManualPrompt promptName should use dirName not displayName (cursor discover)
- [ ] ID: meta-undef-cursor - metadata undefined name in cursor discover (3 sites)
- [ ] ID: meta-undef-claude - metadata undefined name in claude discover (3 sites)
- [ ] ID: stale-jsdoc - Stale JSDoc in a16n format.ts
- [ ] ID: format-test-name - Missing name field in format.test.ts fixture
- [ ] ID: emit-test-names - Phase 7 and CR-10 test fixtures missing top-level name in cursor emit.test.ts
- [ ] ID: cursor-emit-priority - formatAgentSkillMd name priority in cursor emit.ts
- [ ] ID: claude-emit-cast - formatSkill as-string cast in claude emit.ts
- [ ] ID: claude-emit-assert - Weak name assertion in claude emit.test.ts
- [ ] ID: a16n-emit-assert - Add positive name assertion in a16n emit.test.ts
- [ ] ID: integration-assert - Add unique assertion to nested discovery integration test
- [ ] ID: banana-fixture - Update banana fixture to differentiate frontmatter name from filename
- [ ] ID: claude-discover-warn - Add warning for skills with no description in claude discover

### Requires Human Decision
(none)

### Ignored
(none)

## COMPLETED TASKS

### skill-invocation-name-preservation (2026-02-19)
**Complexity:** Level 3 (multi-package feature)
**Reflection:** `memory-bank/reflection/reflection-skill-invocation-name-preservation.md`

**Summary:** Preserve skill invocation names (directory names) through discovery, IR, and conversion. `SimpleAgentSkill.name` is required; IR bumped to v1beta2.

**Changes:**
- **Model (types.ts):** Added required `name: string` to `SimpleAgentSkill` (invocation name)
- **IR version (version.ts):** `CURRENT_IR_VERSION` → v1beta2 (v1beta2 reader accepts v1beta1 files; name derived from filename when missing)
- **IR format (format.ts):** Serialize `name` for SimpleAgentSkill (required)
- **IR parse (parse.ts):** Deserialize `name`; derive from filename for v1beta1 files without name
- **Cursor discover:** Recursive `findSkillDirs`; set `name` from directory (skills) or filename (Phase 2 rules)
- **Claude discover:** Recursive `findSkillDirs`; set `name` from directory
- **Claude emit / Cursor emit / a16n emit:** Use `skill.name` for output directory or IR filename

**Tests:** Unit tests (cursor discover, claude/a16n emit, a16n parse), integration tests (cursor→claude name preservation + nested discovery), version and discover expectations updated for v1beta2.

### plugin-discovery-wiring (2026-02-17)
- Wire up third-party plugin auto-discovery in CLI
- Reflection: `memory-bank/reflection/reflection-plugin-discovery-wiring.md`
