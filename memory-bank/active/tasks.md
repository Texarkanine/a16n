# Current Task: v1-release-rollout-m5

**Complexity:** Level 1

## Build — COMPLETE

- [x] Verified Wave B published on npm (`engine`, `plugin-cursor`, `plugin-claude`, `plugin-a16n` @ `1.0.0`; `plugin-agentsmd` @ `1.0.4`; `models` @ `1.0.0`)
- [x] `release-please-config.json`: added `release-as: "1.0.0"` to `packages/cli`; removed spent M4 keys from engine/plugin-cursor/plugin-claude/plugin-a16n
- [x] `packages/cli/README.md`: added `## Stability` path-touch note
- [x] Full suite green: build 8/8, test 17/17, typecheck 14/14; source still `workspace:*`

**Files changed:** `release-please-config.json`, `packages/cli/README.md`
