# Changelog

## [0.13.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.12.3...@a16njs/docs@0.13.0) (2026-07-19)


### Features

* **docs:** llms.txt indexes, API retention, and local LLM serving ([#139](https://github.com/Texarkanine/a16n/issues/139)) ([f7978e1](https://github.com/Texarkanine/a16n/commit/f7978e1267a745664bcdf8c0c67627f55aa1d8db))

## [0.12.3](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.12.2...@a16njs/docs@0.12.3) (2026-07-15)


### Bug Fixes

* **docs:** Texarkanine paper/ember theme + system color mode ([#137](https://github.com/Texarkanine/a16n/issues/137)) ([b8221d7](https://github.com/Texarkanine/a16n/commit/b8221d7b879b59fe97e2ab02162de67cc759d12d))

## [0.12.2](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.12.1...@a16njs/docs@0.12.2) (2026-06-13)


### Bug Fixes

* **deps:** resolve all open Dependabot security alerts ([#117](https://github.com/Texarkanine/a16n/issues/117)) ([50e754f](https://github.com/Texarkanine/a16n/commit/50e754fc5d122380e9cf6b43ec2a3096a6fcc14a))

## [0.12.1](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.12.0...@a16njs/docs@0.12.1) (2026-06-13)


### Bug Fixes

* **deps:** bump commander from 12.1.0 to 15.0.0 ([#109](https://github.com/Texarkanine/a16n/issues/109)) ([da8266f](https://github.com/Texarkanine/a16n/commit/da8266f077e79f1d54fcb9b0b4559e3db442fa0e))
* **deps:** bump react from 18.3.1 to 19.2.7 ([#111](https://github.com/Texarkanine/a16n/issues/111)) ([8650e3d](https://github.com/Texarkanine/a16n/commit/8650e3dfdfeecdba8077a5df197d2da9f4a196f1))

## [0.12.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.11.0...@a16njs/docs@0.12.0) (2026-06-12)


### Features

* add AGENTS.md plugin (@a16njs/plugin-agentsmd) ([#100](https://github.com/Texarkanine/a16n/issues/100)) ([390994e](https://github.com/Texarkanine/a16n/commit/390994e2f5e05dc559555ee5c0ac83c890fc8bc2))
* **plugin-cursor:** migrate ManualPrompt emit from Commands to Agent Skills ([#99](https://github.com/Texarkanine/a16n/issues/99)) ([7a8d512](https://github.com/Texarkanine/a16n/commit/7a8d5127621a0c7ebe709ae807a5c72eaa83db6c))


### Bug Fixes

* **test:** remediate SLOBAC test suite audit findings across plugins and CLI ([#88](https://github.com/Texarkanine/a16n/issues/88)) ([98b616a](https://github.com/Texarkanine/a16n/commit/98b616a0f0bf0110569e8bd25f42cf5fc323c662))

## [0.11.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.10.0...@a16njs/docs@0.11.0) (2026-04-21)


### Features

* **engine,models,plugin-cursor,plugin-claude,docs:** AgentSkillIO path-rewrites via WrittenFile.sourcePaths; bounded ride-along ref rewrite in scripts/ and references/; buildMapping collision warnings; empty sourcePaths hardening; docs for plugins and --rewrite-path-refs ([d7fbe10](https://github.com/Texarkanine/a16n/commit/d7fbe10f2c8c9184495c08158e5ac39469bc6eff))


### Bug Fixes

* AgentSkillIO path rewrites + rule filename case + CLI symlink detection ([#84](https://github.com/Texarkanine/a16n/issues/84)) ([d7fbe10](https://github.com/Texarkanine/a16n/commit/d7fbe10f2c8c9184495c08158e5ac39469bc6eff))
* **cli:** symlink-safe ESM main-module detection using statSync device+inode instead of realpathSync string compare ([d7fbe10](https://github.com/Texarkanine/a16n/commit/d7fbe10f2c8c9184495c08158e5ac39469bc6eff))
* **plugin-cursor,plugin-claude:** preserve source basename case for emitted rule files; plugin-local case-insensitive collision safety without changing @a16njs/models getUniqueFilename ([d7fbe10](https://github.com/Texarkanine/a16n/commit/d7fbe10f2c8c9184495c08158e5ac39469bc6eff))

## [0.10.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.9.0...@a16njs/docs@0.10.0) (2026-03-15)


### Features

* **docs:** Why Not Hooks ([#82](https://github.com/Texarkanine/a16n/issues/82)) ([3ea32ae](https://github.com/Texarkanine/a16n/commit/3ea32ae2b3d31c2b3c362a1039240c98d50d0e4d))

## [0.9.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.8.2...@a16njs/docs@0.9.0) (2026-03-06)


### Features

* various polish ([#79](https://github.com/Texarkanine/a16n/issues/79)) ([c42cc28](https://github.com/Texarkanine/a16n/commit/c42cc28731013ae34a767bc1a9a47bc526150e7e))

## [0.8.2](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.8.1...@a16njs/docs@0.8.2) (2026-02-23)


### Bug Fixes

* **docs:** frontmatter in "understanding conversions" was incorrect. ([89ae2ba](https://github.com/Texarkanine/a16n/commit/89ae2baaa5a25488b9051e79b66792bef28431d9))

## [0.8.1](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.8.0...@a16njs/docs@0.8.1) (2026-02-23)


### Bug Fixes

* **docs:** reorganize "Understanding Conversions" a bit better ([b1dec85](https://github.com/Texarkanine/a16n/commit/b1dec8540dda05fe79a4c16de884921498e5d6cc))

## [0.8.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.7.1...@a16njs/docs@0.8.0) (2026-02-17)


### Features

* make the plugin infrastructure real and good ([#59](https://github.com/Texarkanine/a16n/issues/59)) ([e3d1190](https://github.com/Texarkanine/a16n/commit/e3d1190f3097c57f56cb889881f6fdc6efb2f1cb))

## [0.7.1](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.7.0...@a16njs/docs@0.7.1) (2026-02-09)


### Bug Fixes

* CLI docs were not being automatically generated into docsite ([#45](https://github.com/Texarkanine/a16n/issues/45)) ([12faf3a](https://github.com/Texarkanine/a16n/commit/12faf3a779648ae991b7819f2b1d03f92dac8b3d))
* **docs:** Fix CLI documentation generation for CI (clean) builds ([#48](https://github.com/Texarkanine/a16n/issues/48)) ([64dae6c](https://github.com/Texarkanine/a16n/commit/64dae6cea8bd2445e5ec18d5660511a6fc6d4356))

## [0.7.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.6.0...@a16njs/docs@0.7.0) (2026-02-08)


### Features

* control over input/output destinations, and path re-writing accordingly ([#42](https://github.com/Texarkanine/a16n/issues/42)) ([943b9ce](https://github.com/Texarkanine/a16n/commit/943b9ce3220b4b8379919646199dfcfca05aaa64))

## [0.6.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.5.0...@a16njs/docs@0.6.0) (2026-02-07)


### Features

* Phase 9 Milestone 7 - Documentation & Polish ([#40](https://github.com/Texarkanine/a16n/issues/40)) ([8779631](https://github.com/Texarkanine/a16n/commit/87796312bb4d9965d80b1103a6c2444adc6f3f25))

## [0.5.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.4.0...@a16njs/docs@0.5.0) (2026-02-04)


### Features

* Add Codecov coverage tracking with per-package flags ([#31](https://github.com/Texarkanine/a16n/issues/31)) ([228b89f](https://github.com/Texarkanine/a16n/commit/228b89f1c9dfb7a1a7f43d5c9456300e23b30863))

## [0.4.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.3.0...@a16njs/docs@0.4.0) (2026-02-01)


### Features

* Phase 8 - handle full AgentSkills.io packages AND Claude Code "rules" ([#27](https://github.com/Texarkanine/a16n/issues/27)) ([ab4001e](https://github.com/Texarkanine/a16n/commit/ab4001e9b70045eb6d416a15966b25469bb8ebb3))

## [0.3.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.2.1...@a16njs/docs@0.3.0) (2026-02-01)


### Features

* **docs:** Fill out docs and make them mostly right ([#25](https://github.com/Texarkanine/a16n/issues/25)) ([e37eba3](https://github.com/Texarkanine/a16n/commit/e37eba3f0b32a013d018b3ecd3f2bf6fa9d26cff))

## [0.2.1](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.2.0...@a16njs/docs@0.2.1) (2026-01-31)


### Bug Fixes

* **docs:** prev/next navigation interaction w/ generated documentation ([#23](https://github.com/Texarkanine/a16n/issues/23)) ([6d537b1](https://github.com/Texarkanine/a16n/commit/6d537b1781b43e828469f53b8af58000748cc084))

## [0.2.0](https://github.com/Texarkanine/a16n/compare/@a16njs/docs@0.1.0...@a16njs/docs@0.2.0) (2026-01-30)


### Features

* **docs:** Add Docusaurus-based docs module w/ generated, versioned APIDoc ([#18](https://github.com/Texarkanine/a16n/issues/18)) ([414882f](https://github.com/Texarkanine/a16n/commit/414882f6f0249a8cb9a507848eddcce371bce4d2))


### Bug Fixes

* **docs:** fix baseUrl and add smart deployment safety checks ([#20](https://github.com/Texarkanine/a16n/issues/20)) ([5a3a86c](https://github.com/Texarkanine/a16n/commit/5a3a86c605fb80883d4b795e64c4d1f6642752aa))
* **docs:** simplify workflow by adding docs to release-please ([#21](https://github.com/Texarkanine/a16n/issues/21)) ([2b7a7ad](https://github.com/Texarkanine/a16n/commit/2b7a7add95af9acb2f9b106f24c490b2afb5d728))
