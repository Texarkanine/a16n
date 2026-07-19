# Changelog

> * **release:** Wave C — promote a16n CLI to 1.0.0 ([#127](https://github.com/Texarkanine/a16n/issues/127)) ([76ad7e4](https://github.com/Texarkanine/a16n/commit/76ad7e49e2b433bf216d2c6c87b933d00683eb98))

# a16n

## [1.0.0](https://github.com/Texarkanine/a16n/compare/a16n@0.15.4...a16n@1.0.0) (2026-06-13)

### Bug Fixes

* **release:** Wave C — promote a16n CLI to 1.0.0 ([#127](https://github.com/Texarkanine/a16n/issues/127)) ([76ad7e4](https://github.com/Texarkanine/a16n/commit/76ad7e49e2b433bf216d2c6c87b933d00683eb98))

## [0.15.4](https://github.com/Texarkanine/a16n/compare/a16n@0.15.3...a16n@0.15.4) (2026-06-13)

### Bug Fixes

* **release:** republish agentsmd@1.0.3 and a16n@0.15.4 (M1 rework) ([#121](https://github.com/Texarkanine/a16n/issues/121)) ([b6bbc66](https://github.com/Texarkanine/a16n/commit/b6bbc66a94915907680702fb501af70b7e89c9a2))

## [0.15.3](https://github.com/Texarkanine/a16n/compare/a16n@0.15.2...a16n@0.15.3) (2026-06-13)

### Bug Fixes

* **release:** restore a16n@latest installability ([#119](https://github.com/Texarkanine/a16n/issues/119)) ([d9aaafe](https://github.com/Texarkanine/a16n/commit/d9aaafe9a62f597335fbbbd50af127accd8f98c3))

## [0.15.2](https://github.com/Texarkanine/a16n/compare/a16n@0.15.1...a16n@0.15.2) (2026-06-13)

### Bug Fixes

* **deps:** resolve all open Dependabot security alerts ([#117](https://github.com/Texarkanine/a16n/issues/117)) ([50e754f](https://github.com/Texarkanine/a16n/commit/50e754fc5d122380e9cf6b43ec2a3096a6fcc14a))

## [0.15.1](https://github.com/Texarkanine/a16n/compare/a16n@0.15.0...a16n@0.15.1) (2026-06-13)

### Bug Fixes

* **deps:** bump commander from 12.1.0 to 15.0.0 ([#109](https://github.com/Texarkanine/a16n/issues/109)) ([da8266f](https://github.com/Texarkanine/a16n/commit/da8266f077e79f1d54fcb9b0b4559e3db442fa0e))

## [0.15.0](https://github.com/Texarkanine/a16n/compare/a16n@0.14.0...a16n@0.15.0) (2026-06-12)

### Features

* add AGENTS.md plugin (@a16njs/plugin-agentsmd) ([#100](https://github.com/Texarkanine/a16n/issues/100)) ([390994e](https://github.com/Texarkanine/a16n/commit/390994e2f5e05dc559555ee5c0ac83c890fc8bc2))
* **plugin-cursor:** migrate ManualPrompt emit from Commands to Agent Skills ([#99](https://github.com/Texarkanine/a16n/issues/99)) ([7a8d512](https://github.com/Texarkanine/a16n/commit/7a8d5127621a0c7ebe709ae807a5c72eaa83db6c))

### Bug Fixes

* **test:** remediate SLOBAC test suite audit findings across plugins and CLI ([#88](https://github.com/Texarkanine/a16n/issues/88)) ([98b616a](https://github.com/Texarkanine/a16n/commit/98b616a0f0bf0110569e8bd25f42cf5fc323c662))

## [0.14.0](https://github.com/Texarkanine/a16n/compare/a16n@0.13.0...a16n@0.14.0) (2026-04-21)

### Features

* **engine,models,plugin-cursor,plugin-claude,docs:** AgentSkillIO path-rewrites via WrittenFile.sourcePaths; bounded ride-along ref rewrite in scripts/ and references/; buildMapping collision warnings; empty sourcePaths hardening; docs for plugins and --rewrite-path-refs ([d7fbe10](https://github.com/Texarkanine/a16n/commit/d7fbe10f2c8c9184495c08158e5ac39469bc6eff))

### Bug Fixes

* AgentSkillIO path rewrites + rule filename case + CLI symlink detection ([#84](https://github.com/Texarkanine/a16n/issues/84)) ([d7fbe10](https://github.com/Texarkanine/a16n/commit/d7fbe10f2c8c9184495c08158e5ac39469bc6eff))
* **cli:** symlink-safe ESM main-module detection using statSync device+inode instead of realpathSync string compare ([d7fbe10](https://github.com/Texarkanine/a16n/commit/d7fbe10f2c8c9184495c08158e5ac39469bc6eff))
* **plugin-cursor,plugin-claude:** preserve source basename case for emitted rule files; plugin-local case-insensitive collision safety without changing @a16njs/models getUniqueFilename ([d7fbe10](https://github.com/Texarkanine/a16n/commit/d7fbe10f2c8c9184495c08158e5ac39469bc6eff))

## [0.13.0](https://github.com/Texarkanine/a16n/compare/a16n@0.12.2...a16n@0.13.0) (2026-03-06)

### Features

* various polish ([#79](https://github.com/Texarkanine/a16n/issues/79)) ([c42cc28](https://github.com/Texarkanine/a16n/commit/c42cc28731013ae34a767bc1a9a47bc526150e7e))

## [0.12.2](https://github.com/Texarkanine/a16n/compare/a16n@0.12.1...a16n@0.12.2) (2026-03-05)

### Bug Fixes

* **plugin-claude:** do not include From line in emitted rules ([#77](https://github.com/Texarkanine/a16n/issues/77)) ([4c9f271](https://github.com/Texarkanine/a16n/commit/4c9f271786b2e54f4f5852d9d1160efb4edcde76))

## [0.12.1](https://github.com/Texarkanine/a16n/compare/a16n@0.12.0...a16n@0.12.1) (2026-02-19)

### Bug Fixes

* SimpleAgentSkill and AgentSkillIO invocable names were lost in translation ([#64](https://github.com/Texarkanine/a16n/issues/64)) ([3266bff](https://github.com/Texarkanine/a16n/commit/3266bff0037f411091c2b7ded55ea7db50b01eba))
* trailing PR feedback from discovery fixes ([#62](https://github.com/Texarkanine/a16n/issues/62)) ([38348fa](https://github.com/Texarkanine/a16n/commit/38348fa0ad415bd62a720497896451b6dff14aef))

## [0.12.0](https://github.com/Texarkanine/a16n/compare/a16n@0.11.1...a16n@0.12.0) (2026-02-17)

### Features

* make the plugin infrastructure real and good ([#59](https://github.com/Texarkanine/a16n/issues/59)) ([e3d1190](https://github.com/Texarkanine/a16n/commit/e3d1190f3097c57f56cb889881f6fdc6efb2f1cb))

### Bug Fixes

* niptick feadback ([#61](https://github.com/Texarkanine/a16n/issues/61)) ([4861ec3](https://github.com/Texarkanine/a16n/commit/4861ec3efaf1a55b9cc3fe1f361d66f3eb468da0))

## [0.11.1](https://github.com/Texarkanine/a16n/compare/a16n@0.11.0...a16n@0.11.1) (2026-02-09)

### Bug Fixes

* nested paths were not preserved during translation ([#44](https://github.com/Texarkanine/a16n/issues/44)) ([d1565b0](https://github.com/Texarkanine/a16n/commit/d1565b0c870b287e5df0b71fb14026aa657ab93a))

## [0.11.0](https://github.com/Texarkanine/a16n/compare/a16n@0.10.0...a16n@0.11.0) (2026-02-08)

### Features

* control over input/output destinations, and path re-writing accordingly ([#42](https://github.com/Texarkanine/a16n/issues/42)) ([943b9ce](https://github.com/Texarkanine/a16n/commit/943b9ce3220b4b8379919646199dfcfca05aaa64))

## [0.10.0](https://github.com/Texarkanine/a16n/compare/a16n@0.9.0...a16n@0.10.0) (2026-02-07)

### Features

* Phase 9 Milestone 7 - Documentation & Polish ([#40](https://github.com/Texarkanine/a16n/issues/40)) ([8779631](https://github.com/Texarkanine/a16n/commit/87796312bb4d9965d80b1103a6c2444adc6f3f25))

## [0.9.0](https://github.com/Texarkanine/a16n/compare/a16n@0.8.0...a16n@0.9.0) (2026-02-07)

### Features

* **plugin-a16n:** Phase 9 M5+M6 - IR Discovery + E2E Integration Tests ([#38](https://github.com/Texarkanine/a16n/issues/38)) ([e57431d](https://github.com/Texarkanine/a16n/commit/e57431d3ea12ffa194009786b6e8f7b3e0f2e9cc))

## [0.8.0](https://github.com/Texarkanine/a16n/compare/a16n@0.7.0...a16n@0.8.0) (2026-02-06)

### ⚠ BREAKING CHANGES

* Phase 9 Milestone 1 - IR Versioning & AgentSkills.io Utilities ([#32](https://github.com/Texarkanine/a16n/issues/32))

### Features

* Phase 9 Milestone 1 - IR Versioning & AgentSkills.io Utilities ([#32](https://github.com/Texarkanine/a16n/issues/32)) ([f9a4484](https://github.com/Texarkanine/a16n/commit/f9a4484c37fe973756f20822b675c1f25e36109a))
* **plugin-a16n:** Phase 9 M4 - IR Emission + CLI Integration ([#37](https://github.com/Texarkanine/a16n/issues/37)) ([b13ed62](https://github.com/Texarkanine/a16n/commit/b13ed62516a0fbd68804aa1c83418f37649dce16))

## [0.7.0](https://github.com/Texarkanine/a16n/compare/a16n@0.6.0...a16n@0.7.0) (2026-02-04)

### Features

* Add Codecov coverage tracking with per-package flags ([#31](https://github.com/Texarkanine/a16n/issues/31)) ([228b89f](https://github.com/Texarkanine/a16n/commit/228b89f1c9dfb7a1a7f43d5c9456300e23b30863))

### Bug Fixes

* **docs:** Update package.json homepages to docsite links ([4a5f242](https://github.com/Texarkanine/a16n/commit/4a5f242012ae8d95eb3fb9183b7a64dbd153a83f))

## [0.6.0](https://github.com/Texarkanine/a16n/compare/a16n@0.5.0...a16n@0.6.0) (2026-02-01)

### Features

* Phase 8 - handle full AgentSkills.io packages AND Claude Code "rules" ([#27](https://github.com/Texarkanine/a16n/issues/27)) ([ab4001e](https://github.com/Texarkanine/a16n/commit/ab4001e9b70045eb6d416a15966b25469bb8ebb3))

## [0.5.0](https://github.com/Texarkanine/a16n/compare/a16n@0.4.0...a16n@0.5.0) (2026-02-01)

### Features

* **docs:** Fill out docs and make them mostly right ([#25](https://github.com/Texarkanine/a16n/issues/25)) ([e37eba3](https://github.com/Texarkanine/a16n/commit/e37eba3f0b32a013d018b3ecd3f2bf6fa9d26cff))

## [0.4.0](https://github.com/Texarkanine/a16n/compare/a16n@0.3.0...a16n@0.4.0) (2026-01-28)

### Features

* Phase 7 - AgentSkills open standard alignment, AgentCommand-&gt;ManualPrompt ([#15](https://github.com/Texarkanine/a16n/issues/15)) ([3f367c2](https://github.com/Texarkanine/a16n/commit/3f367c2b7f945e65742fe526e35af75169125fa1))

## [0.3.0](https://github.com/Texarkanine/a16n/compare/a16n@0.2.0...a16n@0.3.0) (2026-01-28)

### Features

* add npm publishing infrastructure ([#5](https://github.com/Texarkanine/a16n/issues/5)) ([104c8a2](https://github.com/Texarkanine/a16n/commit/104c8a2aacf0837b457e98d8e43816800855b726))
* AgentCommand (phase 4) ([#8](https://github.com/Texarkanine/a16n/issues/8)) ([051a464](https://github.com/Texarkanine/a16n/commit/051a46447dee3406b298a8bc6b31f6b32cc47ca7))
* Phase 2 - FileRule and AgentSkill support ([#3](https://github.com/Texarkanine/a16n/issues/3)) ([3ff1ed7](https://github.com/Texarkanine/a16n/commit/3ff1ed739caa4529fda06e6d530f700072e05b8a))
* Phase 3 - AgentIgnore support and CLI polish ([#4](https://github.com/Texarkanine/a16n/issues/4)) ([eba0dd4](https://github.com/Texarkanine/a16n/commit/eba0dd497ac0c4cdd26d74d451b68d09d1a014bc))
* Phase 5 - gitignore management ([#11](https://github.com/Texarkanine/a16n/issues/11)) ([b39e658](https://github.com/Texarkanine/a16n/commit/b39e6588a5b813f44f0b14aa074fb60374f184d1))
* Phase 6 - --delete-source flag & conditional tense for dry-run actions ([#12](https://github.com/Texarkanine/a16n/issues/12)) ([5899e52](https://github.com/Texarkanine/a16n/commit/5899e52a64209fcfd26dc4c271a68863bb5f463d))
* Phase1 - GlobalPrompt MVP ([592d4c7](https://github.com/Texarkanine/a16n/commit/592d4c7acf44ecbfaf158bb47124d5630b8b1567))
* Task 1 - Monorepo setup with pnpm workspaces ([4016df2](https://github.com/Texarkanine/a16n/commit/4016df2c201c991af6304cda3d0aeb88af252d49))
* Task 8 - CLI with TDD ([ae17551](https://github.com/Texarkanine/a16n/commit/ae175512309db721eb96a8a5a6d2039f8f0e9b77))
* Task 9 - Fixture-based integration tests ([6b7a3e1](https://github.com/Texarkanine/a16n/commit/6b7a3e1a126e9f93af4bc96d582cd0eb014a1d6c))

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
  - @a16njs/plugin-cursor@0.2.0
  - @a16njs/plugin-claude@0.2.0
  - @a16njs/engine@0.0.2

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

### Patch Changes

- Updated dependencies [eba0dd4]
  - @a16njs/plugin-cursor@0.1.0
  - @a16njs/plugin-claude@0.1.0
  - @a16njs/engine@0.0.1
