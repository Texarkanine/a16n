# TASK TRACKING

## CURRENT TASK: (none)

## COMPLETED TASKS

### skill-invocation-name-preservation (2026-02-19)
**Complexity:** Level 3 (multi-package feature)
**Summary:** Preserve skill invocation names (directory names) through discovery, IR, and conversion.

**Changes:**
- **Model (types.ts):** Added `name?: string` to `SimpleAgentSkill` — invocation name from directory
- **IR format (format.ts):** Serialize `name` for SimpleAgentSkill when present
- **IR parse (parse.ts):** Deserialize `name` from frontmatter when present
- **Cursor discover:** Made `findSkillDirs` recursive; set `name` from directory on both `SimpleAgentSkill` and `AgentSkillIO`
- **Claude discover:** Made `findSkillDirs` recursive; set `name` from directory on both types
- **Claude emit:** Use `skill.name` for output directory instead of `sanitizeFilename(sourcePath)`
- **Cursor emit:** Use `skill.name` for output directory (fallback: metadata.name, then sourcePath)
- **a16n emit:** Use `skill.name` for IR filename when present

**Tests added:**
- 4 unit tests: cursor discover (name field, recursive discovery x3)
- 2 unit tests: claude emit (name-based dir, fallback behavior)
- 2 unit tests: a16n emit (name-based filename, name serialization)
- 1 unit test: a16n parse (read name from IR)
- 2 integration tests: cursor→claude name preservation + nested discovery
- Updated 1 existing test for AgentSkillIO name semantics change

### plugin-discovery-wiring (2026-02-17)
- Wire up third-party plugin auto-discovery in CLI
- Reflection: `memory-bank/reflection/reflection-plugin-discovery-wiring.md`
