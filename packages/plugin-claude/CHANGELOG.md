# @a16njs/plugin-claude

## [0.6.0](https://github.com/Texarkanine/a16n/compare/@a16njs/plugin-claude@0.5.0...@a16njs/plugin-claude@0.6.0) (2026-02-01)


### Features

* Phase 8 - handle full AgentSkills.io packages AND Claude Code "rules" ([#27](https://github.com/Texarkanine/a16n/issues/27)) ([ab4001e](https://github.com/Texarkanine/a16n/commit/ab4001e9b70045eb6d416a15966b25469bb8ebb3))

## [0.5.0](https://github.com/Texarkanine/a16n/compare/@a16njs/plugin-claude@0.4.0...@a16njs/plugin-claude@0.5.0) (2026-02-01)


### Features

* **docs:** Fill out docs and make them mostly right ([#25](https://github.com/Texarkanine/a16n/issues/25)) ([e37eba3](https://github.com/Texarkanine/a16n/commit/e37eba3f0b32a013d018b3ecd3f2bf6fa9d26cff))

## [0.4.0](https://github.com/Texarkanine/a16n/compare/@a16njs/plugin-claude@0.3.0...@a16njs/plugin-claude@0.4.0) (2026-01-28)


### Features

* Phase 7 - AgentSkills open standard alignment, AgentCommand-&gt;ManualPrompt ([#15](https://github.com/Texarkanine/a16n/issues/15)) ([3f367c2](https://github.com/Texarkanine/a16n/commit/3f367c2b7f945e65742fe526e35af75169125fa1))

## [0.3.0](https://github.com/Texarkanine/a16n/compare/@a16njs/plugin-claude@0.2.0...@a16njs/plugin-claude@0.3.0) (2026-01-28)


### Features

* add npm publishing infrastructure ([#5](https://github.com/Texarkanine/a16n/issues/5)) ([104c8a2](https://github.com/Texarkanine/a16n/commit/104c8a2aacf0837b457e98d8e43816800855b726))
* AgentCommand (phase 4) ([#8](https://github.com/Texarkanine/a16n/issues/8)) ([051a464](https://github.com/Texarkanine/a16n/commit/051a46447dee3406b298a8bc6b31f6b32cc47ca7))
* Phase 2 - FileRule and AgentSkill support ([#3](https://github.com/Texarkanine/a16n/issues/3)) ([3ff1ed7](https://github.com/Texarkanine/a16n/commit/3ff1ed739caa4529fda06e6d530f700072e05b8a))
* Phase 3 - AgentIgnore support and CLI polish ([#4](https://github.com/Texarkanine/a16n/issues/4)) ([eba0dd4](https://github.com/Texarkanine/a16n/commit/eba0dd497ac0c4cdd26d74d451b68d09d1a014bc))
* Phase 5 - gitignore management ([#11](https://github.com/Texarkanine/a16n/issues/11)) ([b39e658](https://github.com/Texarkanine/a16n/commit/b39e6588a5b813f44f0b14aa074fb60374f184d1))
* Phase1 - GlobalPrompt MVP ([592d4c7](https://github.com/Texarkanine/a16n/commit/592d4c7acf44ecbfaf158bb47124d5630b8b1567))
* Task 1 - Monorepo setup with pnpm workspaces ([4016df2](https://github.com/Texarkanine/a16n/commit/4016df2c201c991af6304cda3d0aeb88af252d49))
* Task 5 - Claude plugin discovery with TDD ([dc9b98d](https://github.com/Texarkanine/a16n/commit/dc9b98d01389780a60ebb22692a301117713dfcc))
* Task 6 - Claude plugin emission with TDD ([354e130](https://github.com/Texarkanine/a16n/commit/354e1302d5dde39764ee10b7bab22c194252ea2a))


### Bug Fixes

* address PR [#1](https://github.com/Texarkanine/a16n/issues/1) round 2 feedback ([51fbeb9](https://github.com/Texarkanine/a16n/commit/51fbeb91ffdc61f9e665f389f6cf36d879cf3ad3))
* **docs:** Remove erroneous claim of MIT license ([e44260a](https://github.com/Texarkanine/a16n/commit/e44260a941fa2276ff7fdb1c3a7ebdf4f40b122f))
* improve error handling in CLI and Claude discover ([9d44b59](https://github.com/Texarkanine/a16n/commit/9d44b592e3f01f8c30c1dba6bf82bc186364b16f))
* PR Feedback ([972f2b7](https://github.com/Texarkanine/a16n/commit/972f2b7e26088c4dc0ed255182e80212dda2c6f2))

## 0.2.0

### Minor Changes

- 051a464: feat: Add AgentCommand support (Cursor commands → Claude skills)

  - Add `AgentCommand` type to models package with `commandName` field
  - Add `isAgentCommand()` type guard
  - Cursor plugin discovers `.cursor/commands/**/*.md` files
    - Simple commands (plain prompt text) become AgentCommand
    - Complex commands ($ARGUMENTS, !, @, allowed-tools) are skipped with warning
  - Claude plugin emits AgentCommand as `.claude/skills/*/SKILL.md`
    - Skills include `description: "Invoke with /command-name"` for slash invocation
  - Claude plugin never discovers AgentCommand (one-way conversion)
  - Cursor plugin supports command pass-through emission

### Patch Changes

- Updated dependencies [051a464]
  - @a16njs/models@0.1.0

## 0.1.0

### Minor Changes

- eba0dd4: Add AgentIgnore bidirectional support and CLI polish

  Phase 3 implementation:

  - Cursor plugin: `.cursorignore` discovery and emission
  - Claude plugin: `permissions.deny` Read rules discovery and emission
  - Bidirectional conversion between `.cursorignore` ↔ `permissions.deny`
  - CLI `--verbose` flag for debugging output
  - Improved warning formatting with icons and hints (chalk)
  - Improved error messages with suggestions
