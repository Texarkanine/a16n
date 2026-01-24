# Wiggum: PR #3

## Metadata
| Field | Value |
|-------|-------|
| PR URL | https://github.com/Texarkanine/a16n/pull/3 |
| Last Check | 2026-01-24T23:10:00Z |
| Last Push | 2026-01-24T21:40:00Z |
| Last CodeRabbit Response | 2026-01-24T21:47:30Z |
| Status | IN_PROGRESS |

## Feedback Tracking

### Actionable (Correct, Auto-fixable)
- [x] Comment ID: 2724612646 - Command injection in buildHookConfig (escape globs) - Status: FIXED
- [x] Comment ID: 2724612649 - YAML special chars in formatSkill description - Status: FIXED
- [x] Comment ID: 2724612650 - FileRule filename collision handling - Status: FIXED
- [x] Comment ID: 2724612651 - AgentSkill directory collision handling - Status: FIXED
- [x] Comment ID: 2724612652 - Documentation consistency for skill discovery - Status: FIXED
- [x] Comment ID: 2724640579 - formatSkill should emit skill name in YAML frontmatter - Status: FIXED
- [x] Comment ID: 2724640582 - settings.local.json should merge with existing content - Status: FIXED

### Requires Human Decision
(none)

### Ignored (Incorrect/Not Applicable)
(none)

## Fix History

### Fix 1 - 2026-01-24T21:40:00Z
- Comments: 2724612646, 2724612649, 2724612650, 2724612651, 2724612652
- Issues: Security (command injection), YAML safety, filename collisions
- Resolution: Added escapeShellArg function, JSON.stringify for descriptions, collision-safe filenames/directories with counter suffix, updated ARCHITECTURE.md
- Files Modified: packages/plugin-claude/src/emit.ts, packages/plugin-claude/test/emit.test.ts, packages/cli/test/integration/integration.test.ts, planning/ARCHITECTURE.md

### Fix 2 - 2026-01-24T23:10:00Z
- Comments: 2724640579, 2724640582
- Issues: Skill name missing from frontmatter, settings.local.json overwrite risk
- Resolution: Updated formatSkill to include name from metadata in YAML frontmatter when available; updated settings.local.json write to merge with existing content (preserve user settings, append PreToolUse hooks)
- Files Modified: packages/plugin-claude/src/emit.ts, packages/plugin-claude/test/emit.test.ts
