# @a16njs/models

## [0.6.0](https://github.com/Texarkanine/a16n/compare/@a16njs/models@0.5.0...@a16njs/models@0.6.0) (2026-02-04)


### Features

* Add Codecov coverage tracking with per-package flags ([#31](https://github.com/Texarkanine/a16n/issues/31)) ([228b89f](https://github.com/Texarkanine/a16n/commit/228b89f1c9dfb7a1a7f43d5c9456300e23b30863))


### Bug Fixes

* **docs:** Update package.json homepages to docsite links ([4a5f242](https://github.com/Texarkanine/a16n/commit/4a5f242012ae8d95eb3fb9183b7a64dbd153a83f))

## [0.5.0](https://github.com/Texarkanine/a16n/compare/@a16njs/models@0.4.0...@a16njs/models@0.5.0) (2026-02-01)


### Features

* Phase 8 - handle full AgentSkills.io packages AND Claude Code "rules" ([#27](https://github.com/Texarkanine/a16n/issues/27)) ([ab4001e](https://github.com/Texarkanine/a16n/commit/ab4001e9b70045eb6d416a15966b25469bb8ebb3))

## [0.4.0](https://github.com/Texarkanine/a16n/compare/@a16njs/models@0.3.0...@a16njs/models@0.4.0) (2026-02-01)


### Features

* **docs:** Fill out docs and make them mostly right ([#25](https://github.com/Texarkanine/a16n/issues/25)) ([e37eba3](https://github.com/Texarkanine/a16n/commit/e37eba3f0b32a013d018b3ecd3f2bf6fa9d26cff))

## [0.3.0](https://github.com/Texarkanine/a16n/compare/@a16njs/models@0.2.0...@a16njs/models@0.3.0) (2026-01-28)


### Features

* Phase 7 - AgentSkills open standard alignment, AgentCommand-&gt;ManualPrompt ([#15](https://github.com/Texarkanine/a16n/issues/15)) ([3f367c2](https://github.com/Texarkanine/a16n/commit/3f367c2b7f945e65742fe526e35af75169125fa1))

## [0.2.0](https://github.com/Texarkanine/a16n/compare/@a16njs/models@0.1.0...@a16njs/models@0.2.0) (2026-01-28)


### Features

* add npm publishing infrastructure ([#5](https://github.com/Texarkanine/a16n/issues/5)) ([104c8a2](https://github.com/Texarkanine/a16n/commit/104c8a2aacf0837b457e98d8e43816800855b726))
* AgentCommand (phase 4) ([#8](https://github.com/Texarkanine/a16n/issues/8)) ([051a464](https://github.com/Texarkanine/a16n/commit/051a46447dee3406b298a8bc6b31f6b32cc47ca7))
* Phase 5 - gitignore management ([#11](https://github.com/Texarkanine/a16n/issues/11)) ([b39e658](https://github.com/Texarkanine/a16n/commit/b39e6588a5b813f44f0b14aa074fb60374f184d1))
* Phase1 - GlobalPrompt MVP ([592d4c7](https://github.com/Texarkanine/a16n/commit/592d4c7acf44ecbfaf158bb47124d5630b8b1567))
* Task 1 - Monorepo setup with pnpm workspaces ([4016df2](https://github.com/Texarkanine/a16n/commit/4016df2c201c991af6304cda3d0aeb88af252d49))
* Task 2 - Models package with TDD ([6af74a4](https://github.com/Texarkanine/a16n/commit/6af74a4748659cbab4dc3b2649e6e9b31963d329))


### Bug Fixes

* **docs:** Remove erroneous claim of MIT license ([e44260a](https://github.com/Texarkanine/a16n/commit/e44260a941fa2276ff7fdb1c3a7ebdf4f40b122f))
* PR Feedback ([972f2b7](https://github.com/Texarkanine/a16n/commit/972f2b7e26088c4dc0ed255182e80212dda2c6f2))

## 0.1.0

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
