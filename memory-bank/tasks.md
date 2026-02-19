# TASK TRACKING

## CURRENT TASK: (none)

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
