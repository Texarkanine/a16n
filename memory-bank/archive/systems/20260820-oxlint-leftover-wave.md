---
task_id: oxlint-leftover-wave
complexity_level: 4
date: 2026-08-20
status: completed
---

# TASK ARCHIVE: Oxlint leftover cleanup and mandatory CI bind

## SUMMARY

Parent-operated L4: six parallel leftover-issue children cleared Oxlint correctness leftovers, then a gated child made lint mandatory. `origin/main` is `7b0d847e` after [#170](https://github.com/Texarkanine/a16n/pull/170). Local `pnpm lint` autofixes; husky pre-commit and CI run `pnpm lint:check`. Parent never implemented leftover product code on `niko/oxlint-leftover-wave`.

## REQUIREMENTS

1. One child and one non-draft PR per leftover issue [#156](https://github.com/Texarkanine/a16n/issues/156)–[#161](https://github.com/Texarkanine/a16n/issues/161).
2. [#160](https://github.com/Texarkanine/a16n/issues/160) stays models+engine; [#161](https://github.com/Texarkanine/a16n/issues/161) stays glob-hook+docs.
3. Leftover children: isolated checkout, full `/niko`, parent inspect at reflect, then archive and a non-draft PR.
4. Do not enable extra Oxlint categories. Do not add lint to CI until leftovers are merged.
5. [#162](https://github.com/Texarkanine/a16n/issues/162) starts only after leftover PRs merge: local autofix, pre-commit check, CI check.

## IMPLEMENTATION

Parent classified L4, planned seven milestones, preflight PASS, then launched children from `main` at `de85d40e` ([#155](https://github.com/Texarkanine/a16n/pull/155)). Cursor `/worktree` is a parent-chat slash command; isolation was `git worktree add` under `~/.cursor/worktrees/<slug>/`. GPT/Gemini children died on Other Models quota / unpaid invoice and were relaunched on Grok.

## MILESTONE LIST

Original list; none added, removed, or reordered.

- [x] Clear oxlint unused-vars in plugin-claude as specified in #156
- [x] Clear oxlint unused-vars in cli as specified in #157
- [x] Clear oxlint unused-vars and irregular-whitespace in plugin-cursor as specified in #158
- [x] Clear oxlint unused-vars in plugin-a16n as specified in #159
- [x] Clear oxlint unused-vars in models and engine as specified in #160
- [x] Clear oxlint unused-vars in glob-hook and docs as specified in #161
- [x] Bind oxlint into local autofix, pre-commit check, and CI as specified in #162

## SUB-RUN SUMMARIES

### #156 plugin-claude — [PR #163](https://github.com/Texarkanine/a16n/pull/163)

L1. Dropped unused IR type imports in nine emit tests, unused `path` in `emit-source-items.test.ts`, and three unused `const result` bindings. Oxlint clean; 197 tests. Do not globally drop `const result = await emit` — most tests assert on it.

### #157 cli — [PR #164](https://github.com/Texarkanine/a16n/pull/164)

L2. Removed 11 unused test imports/destructures (`CommandIO`, `afterEach`, `stdout`, `fixturesDir`/`fixturesDirFor`, unused git-ignore types). Oxlint clean; 229 tests. Dropping `fixturesDir` also requires dropping `fixturesDirFor`.

### #158 plugin-cursor — [PR #166](https://github.com/Texarkanine/a16n/pull/166)

L1. Six unused-vars plus four U+200B in block comments (so `.cursor/skills/*/SKILL.md` would not close `/* */`). Comments now say `.cursor/skills/<name>/SKILL.md`. Oxlint clean; 191 tests.

### #159 plugin-a16n — [PR #167](https://github.com/Texarkanine/a16n/pull/167)

L1. Nine unused imports/locals. `extractRelativeDir` stays a public re-export. Oxlint clean; 111 tests.

### #160 models + engine — [PR #165](https://github.com/Texarkanine/a16n/pull/165)

L2. Eight unused names including `catch {` in `readSkillFiles`. No exported behavior change. Oxlint clean; 131 + 175 tests. Engine tests need bundled plugins built in a fresh checkout.

### #161 glob-hook + docs — [PR #168](https://github.com/Texarkanine/a16n/pull/168)

L2 by the two-package tree, one unused import each (`HookInput`, `dirname`). Oxlint clean; 37 + 56 tests.

### #162 CI bind — [PR #170](https://github.com/Texarkanine/a16n/pull/170)

L2. `pnpm lint` / `lint:fix` → `oxlint --fix`. `pnpm lint:check` → `oxlint`. Husky 9.1.7 `prepare` + `.husky/pre-commit` → `pnpm lint:check`. CI lint step after install; install sets `HUSKY=0`. `.oxlintrc.json` unchanged. Chose husky over `simple-git-hooks` so it would not overwrite a machine-local `.git/hooks/pre-commit`.

## SYSTEM STATE

Root Oxlint (correctness as error) is green. Local lint autofixes. Agents cannot commit leftover unused-vars or irregular-whitespace without failing the hook. CI fails the same check. CONTRIBUTING and `techContext.md` no longer say lint is optional. Child archives already live under `memory-bank/archive/` on `main`. `plugin-agentsmd` was already clean before this wave.

After a normal clone, `pnpm install` sets `core.hooksPath` to `.husky/_`. Shared-`.git` checkouts must use `HUSKY=0 pnpm install` or husky writes the parent config and bypasses machine-local hooks (including ai-rizz).

## CROSS-RUN INSIGHTS

- `oxlint --fix` does not clear unused-vars or irregular-whitespace. Leftover tickets are hand deletes.
- Unused-var cleanup is not a TDD unit. Oxlint is the checker. Change-detector tests were forbidden and none shipped. Same lesson as [#74](https://github.com/Texarkanine/a16n/issues/74) / [.cursor-rules#116](https://github.com/Texarkanine/.cursor-rules/issues/116).
- Isolated checkouts need `pnpm install` and a workspace build before `pnpm --filter <pkg> test`; that filter does not run Turbo’s `test` → `build` edge.
- Task children cannot invoke `/worktree`. Parent-created `git worktree add` paths worked. GPT/Gemini died on Other Models quota; Grok finished the wave.
- Husky in a shared-`.git` checkout writes parent `core.hooksPath`. Spike, unset, document `HUSKY=0`. Do not run `prepare` from those checkouts.

## TESTING

Each leftover child: package `oxlint` clean + named package tests. #162: `pnpm lint`, `lint:check`, and `oxlint` exit 0; hook and CI contain no `--fix`; `pnpm test` 17/17 turbo tasks. Parent re-ran oxlint on leftover product diffs before archive+PR.

## LESSONS LEARNED

Parent L4 files must stay off the children’s base ref or they will try to run the parent L4. Standing consent through reflect, then parent inspect, then archive+PR, kept `memory-bank/active/` out of leftover merges.

## PROCESS IMPROVEMENTS

Do not put `/worktree` in a Task prompt; the IDE injects the Worktree Skill and children may create a second checkout. Ask for isolation at launch or parent-create the tree.

## TECHNICAL IMPROVEMENTS

Optional later: stop copy-pasting the full IR import list in plugin emit tests. Enabling extra Oxlint categories is still a later choice.

## NEXT STEPS

None. Wave complete. Isolated leftover and #162 checkouts removed.
