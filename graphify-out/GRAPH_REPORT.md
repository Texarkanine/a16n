# Graph Report - a16n  (2026-08-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2050 nodes · 2870 edges · 216 communities (106 shown, 99 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 113 edges (avg confidence: 0.85)
- Token cost: 49,042 input · 2,576 output

## Graph Freshness
- Built from commit: `91f1e107`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CLI Convert Command
- Feature Archive History
- Cursor Plugin Discovery Tests
- a16n IR and Plugin Architecture
- plugin-a16n Package Manifest
- Root Workspace Tooling
- Engine Package Manifest
- plugin-claude Package Manifest
- plugin-cursor Package Manifest
- CLI Docs Generation Script
- Claude Plugin Discovery Tests
- Models Package Manifest
- Docs Build Scripts
- plugin-agentsmd Package Manifest
- plugin-a16n Discover and Emit
- Release-Please Configuration
- TypeDoc Versioned Config
- SumMem Memory Tree
- CLI Integration Test Suite
- Docusaurus Site Config
- AGENTS.md Plugin Pipeline
- Niko Workflow Levels
- Turborepo Task Pipeline
- Claude Discovery and Parsing
- Customization Type Taxonomy
- a16n IR Model Types
- IR Type Guards & Helpers
- Cursor Rule Discovery
- Docs Dev Dependencies
- In-Memory Workspace
- AgentSkills.io Read/Write
- Local Workspace Filesystem
- Base TypeScript Config
- SumMem Wake Formatting
- Docusaurus Runtime Dependencies
- Plugin Interface Contract
- Docs TypeScript Config
- Glob Hook CLI IO
- Cursor Emit Formatting
- SumMem Nap Packing
- CLI Package Dependencies
- SumMem View Healing
- CLI Package Manifest
- TypeDoc Configuration
- Engine Transformation API
- SumMem CLI Entrypoint
- Plugin Discovery
- Path Rewriting
- Glob Hook Manifest
- SumMem Store Location
- SumMem Store Writes
- Skill Specs & Cursor Plugin
- CI and Docs Fixes
- CLI Integration Tests
- Plugin Loading & Registry
- Claude Emit Formatting
- Engine Core
- Plugin Registry
- Conversion Warning Codes
- Graphify Graph Pipeline
- Oxlint Configuration
- Glob Hook Dev Dependencies
- Glob Hook TS Config
- Models TS Config
- Repo Tooling Stack
- Agent Skill Keywords
- Package Keywords
- Browserslist Targets
- SumMem Frontier Expansion
- TypeScript Standards
- Config Type Validation
- Workspace Publish Invariants
- CLI TS Config
- Engine TS Config
- Plugin a16n TS Config
- Plugin AGENTS.md TS Config
- Deploy Environment Manifest
- Plugin Claude TS Config
- Plugin Cursor TS Config
- Written File Refactor
- Monorepo Package Layout
- Shared Dev Dependencies
- Package Build Scripts
- Docs Package Manifest
- Package Build Scripts
- Glob Hook Keywords
- Secure Deploy Skill
- Memory Bank & SumMem
- Level 4 Planning Workflow
- Creative Phase Templates
- Documentation Site Build
- Docs Overview Pages
- Docs Version Picker
- Publish Shape Test
- Database Migration Guides
- Simple Skill Fixtures
- Repository Metadata
- Repository Metadata
- Glob Hook CLI Test
- Customization Portability
- Target Users and Use Cases
- React Component Standards
- IO Spec Skill
- Manual Prompt Skills
- Docs Release Cadence
- Documentation Site Guide
- Release and Deploy Workflows
- Frontend Component Rules
- Micromatch Dependency
- Changelog Staging Script
- Docs Sidebar Config
- Prisma ORM Guidelines
- pnpm Root Instructions
- Banana Printer Skill
- Build Artifact Cleanup
- File Verification System
- Code Review Skill
- Tomato Helper Skill
- Simple Agent Skill Type
- Agent Skill IO Type
- File Rule Glob Matching
- Manual Prompt Type
- Version Field Matching
- Agent Ignore Patterns
- PR Review Commands
- Deployment Skill Fixtures
- CI and Dependabot Config
- Deployment Checklist Skills
- Claude-Format Deployment Skills
- Database Migration Skills
- Cursor-Format Database Skills
- Glob Hook Binary
- Node Engine Requirements
- Directory Guideline Rules
- Testing Guidelines Skill
- API Development Rules
- Security and TypeScript Paths
- Migration Shell Script
- Pre-check Shell Script
- Deploy Shell Script
- Oxlint CI Integration
- Invalid Config Fixtures
- Graphify Skill
- GitHub PR Skill
- Niko Skill
- Security Review Prompt
- API Package Versioning
- Level 1 Workflow
- Top-level Rule
- Testing Best Practices Skill
- CLI Discover Command
- Code Style Rules
- Codecov Config
- Documentation
- Glob Hook
- Explain Command
- Fix-issue Command
- Secure Command
- Banana Printer Skill
- Deploy Service Fixture Skill
- No Spec Skill
- Tomato Helper Skill
- Niko Reflect Phase Skill
- Release-Please Migration
- Description Field
- Relative Directory Field
- LLM-friendly Docs Retention
- SLOBAC Audit Remediation
- Oxlint Cleanup and CI Bind
- CLI Changelog
- Testing and DRY Principles
- Scoped Cleanup Skill
- CLAUDE.md Project Rules
- Multiple CLAUDE.md Rules
- Version History and Changelog
- CLI Reference Docs
- Engine API Reference
- Models API Reference
- Plugin-agentsmd Changelog
- Plugin-claude Changelog
- Claude Ignore Empty Fixture
- Claude Ignore Project Fixture
- Claude Ignore Mixed Fixture
- Global Project Guidelines
- Simple Testing Skill
- Testing Skill Fixture
- Manual Task Skill
- Clean Skill
- Nameless Skill
- No-spec Skill Fixture
- YAML Edge-case Rule
- Multiline Description Skill
- PR Feedback Judge Command
- Simple Command
- Backend API Command
- Frontend Component Command
- Analyze Command
- Packages Overview
- No Frontmatter Test
- Docs README
- Monorepo Structure
- Skill Field Preservation
- Docs Theme
- TypeScript Requirement
- Malformed YAML Frontmatter

## God Nodes (most connected - your core abstractions)
1. `scripts` - 38 edges
2. `cursorPlugin` - 20 edges
3. `emit()` - 19 edges
4. `claudePlugin` - 18 edges
5. `emit()` - 17 edges
6. `compilerOptions` - 17 edges
7. `AgentCustomization` - 16 edges
8. `CustomizationType` - 15 edges
9. `PluginRegistry` - 15 edges
10. `handleGitIgnoreMatch()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Turbo` --semantically_similar_to--> `Turborepo`  [INFERRED] [semantically similar]
  package.json → CONTRIBUTING.md
- `TypeScript` --shares_data_with--> `a16n CLI`  [EXTRACTED]
  package.json → CONTRIBUTING.md
- `Husky` --references--> `Oxlint`  [INFERRED]
  package.json → CONTRIBUTING.md
- `@a16njs/engine` --uses--> `Plugin Registry Pattern`  [INFERRED]
  packages/README.md → memory-bank/archive/systems/20260215-architectural-redesign.md
- `Plugin Auto-Discovery` --references--> `@a16njs/engine`  [EXTRACTED]
  memory-bank/archive/features/20260215-plugin-discovery.md → packages/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **a16n Plugin System** — contributing_plugin_cursor, contributing_plugin_claude, contributing_plugin_a16n, contributing_plugin_agentsmd [EXTRACTED 1.00]
- **Architectural Foundations and Patterns** — plugin_registry_pattern, workspace_abstraction_pattern, ir_versioning_system [EXTRACTED 1.00]
- **CLI Separation of Concerns** — cli_index_file, cli_run_file, cli_bin_entry [EXTRACTED 1.00]
- **Configuration Type Discovery System** — config_type_agent_skill_io, config_type_agent_ignore, config_type_file_rule, config_type_global_prompt, config_type_manual_prompt, config_type_simple_agent_skill [EXTRACTED 1.00]
- **Conversion Pipeline: Source → IR → Target** — a16n_engine, agentcustomization_ir, cursor_format, claude_code_format [EXTRACTED 1.00]
- **Creative Phase Workflow System** — cursor_skills_shared_niko_references_phases_creative_creative_phase_algorithm, cursor_skills_shared_niko_references_phases_creative_creative_phase_architecture, cursor_skills_shared_niko_references_phases_creative_creative_phase_generic, cursor_skills_shared_niko_references_phases_creative_creative_phase_uiux, cursor_skills_shared_niko_references_phases_creative_creative_phase_template [EXTRACTED 1.00]
- **Agent Customization Type Taxonomy** — global_prompt, file_rule, simple_agent_skill, manual_prompt, agentcustomization_ir [EXTRACTED 1.00]
- **Unified Customization Type System** — packages_models_readme_customization_type, packages_docs_docs_plugin_a16n_index_global_prompt, packages_docs_docs_plugin_a16n_index_file_rule, packages_docs_docs_plugin_a16n_index_simple_agent_skill [EXTRACTED 1.00]
- **Database Migration Workflow** — packages_plugin_claude_test_fixtures_claude_skills_complex_from_claude_claude_skills_database_migrations_skill, schema_versioning, rollback_procedure [EXTRACTED 1.00]
- **Deployment Pipeline Verification** — pre_commit_hook, security_scan_verification, post_deploy_hook [EXTRACTED 1.00]
- **Documentation Modernization (Rounds 1-2)** — docs_workflow_fixes, docs_workflow_simplification, docs_cleanup_r2, pattern_release_as_boundary, pattern_discovery_emission [EXTRACTED 1.00]
- **Git-Ignore Output Management Phase 5** — phase5_bugfixes_r1, phase5_bugfixes_r2r3, issue_empty_globs_validation, issue_gitignore_routing, issue_semaphore_accumulation [EXTRACTED 1.00]
- **Graphify Extraction Pipeline** — _claude_skills_graphify_skill_detection, _claude_skills_graphify_skill_extraction, _claude_skills_graphify_skill_build [EXTRACTED 1.00]
- **Hub Format Conversion Strategy** — packages_docs_docs_plugin_a16n_index_hub_format, packages_docs_docs_plugin_a16n_index_a16n_ir, packages_engine_readme_a16n_engine [EXTRACTED 1.00]
- **Oxlint Integration and Cleanup** — task_issue_74_oxlint_binding, task_issue_156_claude_unused_vars, task_issue_157_cli_unused_vars, task_issue_159_a16n_unused_vars, task_issue_162_oxlint_ci [EXTRACTED 1.00]
- **Memory Bank Context Ecosystem** — memory_bank, persistent_context, ephemeral_context, cursor_skills_shared_nk_chat_skill, cursor_skills_shared_nk_refresh_skill, cursor_skills_shared_nk_save_skill [EXTRACTED 1.00]
- **Memory Bank Lifecycle Management** — memory_bank_persistent_files, memory_bank_ephemeral_files, cursor_skills_shared_niko_references_core_reconcile_persistent [EXTRACTED 1.00]
- **Monorepo Package Structure** — contributing_cli, contributing_engine, contributing_models [EXTRACTED 1.00]
- **Plugin Architecture for Format Conversion** — packages_engine_readme_a16n_engine, packages_docs_docs_plugin_a16n_index_plugin_a16n, packages_docs_docs_plugin_claude_index_plugin_claude, packages_docs_docs_plugin_cursor_index_plugin_cursor [EXTRACTED 1.00]
- **Plugin-Based Conversion Pipeline** — cursor_plugin, claude_plugin, a16n_plugin, agentsmd_plugin, plugin_architecture, intermediate_representation [EXTRACTED 1.00]
- **Plugin-Based Tool Integration Ecosystem** — cursor_plugin, claude_plugin, a16n_plugin, agentsmd_plugin, a16n_engine [EXTRACTED 1.00]
- **Pre-commit Security Workflow** — pre_commit_hook, pre_check_verification, security_scan_verification [EXTRACTED 1.00]
- **Security Fixes Phase (PR #3)** — issue_command_injection, issue_yaml_injection, pattern_collision_safe_naming [EXTRACTED 1.00]
- **AgentSkills.io Spec Compliance Work** — task_issue_142_spec_compliance, task_issue_143_spec_fields, task_issue_148_cursor_paths [EXTRACTED 1.00]
- **Test Fixtures - Skill Classification Coverage** — packages_plugin_claude_test_fixtures_claude_skills_nonspec_from_claude_claude_skills_clean_skill_clean, packages_plugin_claude_test_fixtures_claude_skills_spec_fields_from_claude_claude_skills_io_spec_skill_io_spec, packages_plugin_claude_test_fixtures_claude_skills_spec_fields_from_claude_claude_skills_manual_spec_skill_manual_spec [EXTRACTED 1.00]
- **TypeScript Strict Mode and Type Safety Standard** — agentsmd_to_claude_instructions, agentsmd_to_cursor_instructions, packages_cli_test_integration_fixtures_claude_ignore_to_cursor_from_claude_claude_ignore_to_cursor_guidelines, cursor_command_to_claude_guidelines, cursor_ignore_to_claude_guidelines, typescript_concept [EXTRACTED 1.00]
- **Cursor Command Variants** — packages_plugin_cursor_test_fixtures_cursor_command_mentions_from_cursor_cursor_commands_coderabbit_pr_coderabbit_pr_command, packages_plugin_cursor_test_fixtures_cursor_command_mixed_from_cursor_cursor_commands_complex_complex_command, packages_plugin_cursor_test_fixtures_cursor_command_nested_from_cursor_cursor_commands_backend_api_api_command [INFERRED 0.80]
- **Format Conversion and Transformation Pipeline** — path_reference_rewriting, ir_roundtrip_durability, agent_customization_portability, a16n_plugin [INFERRED 0.85]
- **ManualPrompt IR and Spec Alignment** — task_cursor_skills_migration, task_issue_147_manualprompt_description, feature_phase7_agentskills [INFERRED 0.85]
- **Niko Workflow Gate Sequence** — preflight_validation, cursor_skills_shared_niko_qa_skill, level_2_archive [INFERRED 0.85]
- **Multi-Format Plugin Ecosystem** — cursor_plugin, claude_plugin, a16n_plugin_architecture, glob_hook_package [INFERRED 0.85]
- **Skill and Configuration Format Conversion** — claude_cleanup_skill_from, cursor_cleanup_skill_to, cursor_banana_skill, claude_banana_skill, cursor_tomato_skill, claude_tomato_skill [INFERRED 0.85]
- **Skill Specification Pattern** — cursor_skill_io_spec, cursor_skill_manual_spec, cursor_skill_simple_spec [INFERRED 0.85]
- **AgentSkills.io Spec Field Handling** — skill_field_preservation, packages_plugin_claude_test_fixtures_claude_skills_spec_fields_from_claude_claude_skills_io_spec_skill_io_spec, packages_plugin_cursor_test_fixtures_cursor_command_mixed_from_cursor_cursor_commands_complex_complex_command [INFERRED 0.85]
- **Configuration Frontmatter Validation Process** — version_v1beta1, config_type_global_prompt, validation_missing_version [INFERRED 0.85]
- **WrittenFile Consumer Patterns** — path_rewriter, convert_command, source_paths_field [INFERRED 0.85]
- **Niko Phase Execution Loop** — level_2_plan, tdd_process, level_2_build, level_2_reflect [INFERRED 0.95]

## Communities (216 total, 99 thin omitted)

### Community 0 - "CLI Convert Command"
Cohesion: 0.09
Nodes (40): applyConflictResolution(), ConflictRouteContext, ConvertCommandOptions, handleConvert(), handleDeleteSource(), handleGitIgnore(), handleGitIgnoreMatch(), routeConflict() (+32 more)

### Community 1 - "Feature Archive History"
Cohesion: 0.05
Nodes (56): CLI Docs CI Build Failure Fix, CLI Docs Showing Same Content For All Versions, CodeRabbit Nitpick Fixes (Post-Rearchitecture), AgentSkills.io Standard, GlobalPrompt Type, ManualPrompt Type, Test-Driven Development, CR-10 Source Tracking for WrittenFile (+48 more)

### Community 2 - "Cursor Plugin Discovery Tests"
Cohesion: 0.08
Nodes (25): cursorPlugin, fixturesDir, fixturesDir, fixturesDir, fixturesDir, fixturesDir, fixturesDir, fixturesDir (+17 more)

### Community 3 - "a16n IR and Plugin Architecture"
Cohesion: 0.06
Nodes (52): @a16njs/engine, @a16njs/models, A16n Plugin (a16n), a16n Plugin Architecture, A16nPlugin Interface, a16n: Agent Customization Conversion Tool, @a16njs/models, Agent Customization Portability (+44 more)

### Community 4 - "plugin-a16n Package Manifest"
Cohesion: 0.04
Nodes (46): author, bugs, url, dependencies, @a16njs/models, gray-matter, yaml, description (+38 more)

### Community 5 - "Root Workspace Tooling"
Cohesion: 0.04
Nodes (45): husky, oxlint, devDependencies, husky, oxlint, rimraf, turbo, typescript (+37 more)

### Community 6 - "Engine Package Manifest"
Cohesion: 0.04
Nodes (45): author, bugs, url, dependencies, @a16njs/models, description, devDependencies, @a16njs/plugin-claude (+37 more)

### Community 7 - "plugin-claude Package Manifest"
Cohesion: 0.04
Nodes (45): author, bugs, url, dependencies, @a16njs/models, gray-matter, description, devDependencies (+37 more)

### Community 8 - "plugin-cursor Package Manifest"
Cohesion: 0.04
Nodes (45): author, bugs, url, dependencies, @a16njs/models, gray-matter, description, devDependencies (+37 more)

### Community 9 - "CLI Docs Generation Script"
Cohesion: 0.10
Nodes (41): ArgumentInfo, buildCli(), CommandInfo, exec(), extractCommandInfo(), generateCliDocsForVersion(), generateCliReference(), generateCommandMarkdown() (+33 more)

### Community 10 - "Claude Plugin Discovery Tests"
Cohesion: 0.09
Nodes (21): claudePlugin, fixturesDir, fixturesDir, fixturesDir, fixturesDir, fixturesDir, fixturesDir, fixturesDir (+13 more)

### Community 11 - "Models Package Manifest"
Cohesion: 0.05
Nodes (42): author, bugs, url, dependencies, gray-matter, description, devDependencies, @types/node (+34 more)

### Community 12 - "Docs Build Scripts"
Cohesion: 0.05
Nodes (38): scripts, apidoc:current, apidoc:current:engine, apidoc:current:models, apidoc:current:plugin-a16n, apidoc:current:plugin-agentsmd, apidoc:current:plugin-claude, apidoc:current:plugin-cursor (+30 more)

### Community 13 - "plugin-agentsmd Package Manifest"
Cohesion: 0.05
Nodes (37): author, dependencies, @a16njs/models, description, devDependencies, @types/node, typescript, vitest (+29 more)

### Community 14 - "plugin-a16n Discover and Emit"
Cohesion: 0.10
Nodes (25): discover(), discoverAgentSkillIO(), discoverStandardType(), findMdFiles(), VALID_TYPE_DIRS, emit(), emitAgentSkillIO(), emitStandardIR() (+17 more)

### Community 15 - "Release-Please Configuration"
Cohesion: 0.05
Nodes (36): bump-minor-pre-major, bump-patch-for-minor-pre-major, include-component-in-tag, include-v-in-tag, packages, changelog-path, component, changelog-path (+28 more)

### Community 16 - "TypeDoc Versioned Config"
Cohesion: 0.06
Nodes (30): compilerOptions, baseUrl, ignoreDeprecations, paths, rootDir, entryPointStrategy, excludeInternal, excludePrivate (+22 more)

### Community 17 - "SumMem Memory Tree"
Cohesion: 0.11
Nodes (27): _as_child(), child_nap_stem(), _digests_of_dict(), _digests_of_tree(), dumps_tree(), loads_tree(), NapChild, _note_child() (+19 more)

### Community 18 - "CLI Integration Test Suite"
Cohesion: 0.16
Nodes (19): fixturesDir, fixturesDir, fixturesDir, fixturesDir, fixturesDir, fixturesDir, COMBINATIONS, emittedFrontmatterKeys() (+11 more)

### Community 19 - "Docusaurus Site Config"
Cohesion: 0.11
Nodes (21): config, __dirname, __filename, generatedRoot, docsDir, removed, staticRoot, docsDir (+13 more)

### Community 20 - "AGENTS.md Plugin Pipeline"
Cohesion: 0.13
Nodes (15): discover(), findAgentsFiles(), emit(), fileRuleTargetDir(), resolveSafeDir(), agentsmdPlugin, fixturesDir, tempDir (+7 more)

### Community 21 - "Niko Workflow Levels"
Cohesion: 0.10
Nodes (28): Creative Phase Types, Niko Creative Phase Skill, Niko Plan Phase Skill, Niko Preflight Phase Skill, Niko QA Phase Skill, Task Complexity Determination, Intent Clarification Process, Memory Bank Initialization (+20 more)

### Community 22 - "Turborepo Task Pipeline"
Cohesion: 0.08
Nodes (27): coverage/**, .docusaurus/**, dependsOn, outputs, cache, dependsOn, outputs, dependsOn (+19 more)

### Community 23 - "Claude Discovery and Parsing"
Cohesion: 0.12
Nodes (23): ClaudeRuleFrontmatter, convertReadRuleToPattern(), discover(), discoverAgentIgnore(), findClaudeFiles(), findClaudeRules(), traverse(), findSkillDirs() (+15 more)

### Community 24 - "Customization Type Taxonomy"
Cohesion: 0.10
Nodes (26): AGENTS.md Format, AgentSkills.io Specification, CLAUDE.md Format, File Rule, Global Prompt, Manual Prompt, plugin-agentsmd README, plugin-claude README (+18 more)

### Community 25 - "a16n IR Model Types"
Cohesion: 0.13
Nodes (25): a16n IR (Intermediate Representation), AgentIgnore, AgentSkillIO, FileRule, GlobalPrompt, Hub Format Pattern, ManualPrompt, @a16njs/plugin-a16n (+17 more)

### Community 26 - "IR Type Guards & Helpers"
Cohesion: 0.18
Nodes (20): createId(), getUniqueFilename(), inferGlobalPromptName(), isAgentIgnore(), isAgentSkill, isAgentSkillIO(), isFileRule(), isGlobalPrompt() (+12 more)

### Community 27 - "Cursor Rule Discovery"
Cohesion: 0.15
Nodes (21): classifyRule(), discover(), discoverCommands(), discoverCursorIgnore(), discoverSkills(), findCommandFiles(), findMdcFiles(), findSkillDirs() (+13 more)

### Community 28 - "Docs Dev Dependencies"
Cohesion: 0.09
Nodes (23): @docusaurus/module-type-aliases, @docusaurus/types, @easyops-cn/docusaurus-search-local, devDependencies, commander, @docusaurus/module-type-aliases, @docusaurus/types, @easyops-cn/docusaurus-search-local (+15 more)

### Community 29 - "In-Memory Workspace"
Cohesion: 0.13
Nodes (3): MemoryWorkspace, ReadOnlyWorkspace, __dirname

### Community 30 - "AgentSkills.io Read/Write"
Cohesion: 0.24
Nodes (16): assignSpecFields(), coerceSpecMetadata(), extractSpecFields(), formatSpecFieldsYaml(), ParsedSkill, ParsedSkillFrontmatter, parseSkillFrontmatter(), readAgentSkillIO() (+8 more)

### Community 31 - "Local Workspace Filesystem"
Cohesion: 0.15
Nodes (5): LocalWorkspace, resolveRoot(), toWorkspace(), Workspace, WorkspaceEntry

### Community 32 - "Base TypeScript Config"
Cohesion: 0.10
Nodes (19): ES2022, compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib (+11 more)

### Community 33 - "SumMem Wake Formatting"
Cohesion: 0.12
Nodes (20): _day_from_stamp(), fold_request(), format_wake_line(), Return a unique prefix of *cid* among distinct *ids*, at least *floor* hex…, Return the unique id in *ids* that *token* prefixes. Raise ValueError if none…, Return YYYY-MM-DD from a 16-character UTC filename stamp., Return one wake line for *node* using unique prefixes from *ids*., Return an OptMem-style nap prompt for the oldest equal-grain pair when over… (+12 more)

### Community 34 - "Docusaurus Runtime Dependencies"
Cohesion: 0.11
Nodes (19): clsx, @docusaurus/core, @docusaurus/faster, docusaurus-plugin-llms, @docusaurus/preset-classic, @docusaurus/theme-mermaid, dependencies, clsx (+11 more)

### Community 35 - "Plugin Interface Contract"
Cohesion: 0.18
Nodes (15): A16nPlugin, DiscoveryResult, EmitOptions, EmitResult, PluginPathPatterns, WrittenFile, AgentCustomization, CustomizationType (+7 more)

### Community 36 - "Docs TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, jsx, noEmit, outDir, rootDir, exclude, extends, include (+9 more)

### Community 37 - "Glob Hook CLI IO"
Cohesion: 0.25
Nodes (12): main(), parseArgs(), readAllStdin(), readContextFile(), createEmptyOutput(), createMatchOutput(), parseStdin(), writeOutput() (+4 more)

### Community 38 - "Cursor Emit Formatting"
Cohesion: 0.24
Nodes (15): emit(), emitAgentSkillIO(), formatAgentSkillMd(), formatAgentSkillMdc(), formatFileRuleMdc(), formatGlobalPromptMdc(), formatManualPromptAsSkill(), getUniqueFilename() (+7 more)

### Community 39 - "SumMem Nap Packing"
Cohesion: 0.14
Nodes (15): _empty_pack(), _index_tree(), init_text(), named_ids(), nap_stem(), prompt_text(), Return the agent bootstrap inserted at the top of AGENTS.md., Return the full `init` print: insert recipe plus prompt_text(). (+7 more)

### Community 40 - "CLI Package Dependencies"
Cohesion: 0.12
Nodes (17): @a16njs/engine, @a16njs/plugin-a16n, @a16njs/plugin-agentsmd, chalk, dependencies, @a16njs/engine, @a16njs/models, @a16njs/plugin-a16n (+9 more)

### Community 41 - "SumMem View Healing"
Cohesion: 0.17
Nodes (17): _adjacent_nodes(), _first_overlap(), heal_view(), leaf_digests(), leafset_id(), list_view(), _parse_nap_stem(), Return the first 16 lowercase hex characters of SHA-256 of sorted digest hex. (+9 more)

### Community 42 - "CLI Package Manifest"
Cohesion: 0.12
Nodes (15): author, bin, a16n, bugs, url, description, engines, node (+7 more)

### Community 43 - "TypeDoc Configuration"
Cohesion: 0.12
Nodes (15): entryPointStrategy, excludeInternal, excludePrivate, excludeProtected, Class, Enum, Function, Interface (+7 more)

### Community 44 - "Engine Transformation API"
Cohesion: 0.19
Nodes (11): ConversionOptions, ConversionResult, DiscoverAndRegisterResult, GitIgnoreResult, PluginInfo, ContentTransformation, PathRewritingTransformation, TransformationContext (+3 more)

### Community 45 - "SumMem CLI Entrypoint"
Cohesion: 0.13
Nodes (16): _cli_argv(), how_to_text(), is_range_token(), knobs(), main(), Return the wait-free listing of the mixed view under *parent*, or empty., Return True if *token* is a positional range rather than a content id., Refuse to run on Python older than 3.11. (+8 more)

### Community 46 - "Plugin Discovery"
Cohesion: 0.22
Nodes (9): discoverInstalledPlugins(), getDefaultSearchPaths(), getGlobalNodeModulesFromArgv1(), isValidPlugin(), PluginDiscoveryOptions, PluginDiscoveryResult, PluginLoadError, resolvePluginEntry() (+1 more)

### Community 47 - "Path Rewriting"
Cohesion: 0.22
Nodes (9): applyMapping(), buildMapping(), BuildMappingResult, detectOrphans(), escapeRegExp(), isRewritableSkillResource(), PathMapping, rewriteContent() (+1 more)

### Community 48 - "Glob Hook Manifest"
Cohesion: 0.13
Nodes (14): author, bugs, url, description, exports, files, homepage, dist (+6 more)

### Community 49 - "SumMem Store Location"
Cohesion: 0.18
Nodes (14): Path, catalog_text(), find_store_parent(), _fold_path_flag(), is_store(), _nap_caption(), Return `` --path REL`` when walk-up from cwd would not select *parent*, else…, Walk from *cwd* to the first directory that contains .git. Raise ValueError if… (+6 more)

### Community 50 - "SumMem Store Writes"
Cohesion: 0.15
Nodes (15): ensure_store(), Reject *now* unless tzinfo is datetime.timezone.utc., Create notes/, naps/, and default config under *parent* if missing. Does not…, Reject empty, multi-line, or over-long one-line entries., Temp-replace `{stem}.tree` then `{stem}.summ` with the hashed buffers., Copy *child* bytes into the store without overwriting an existing dest., Run *fn* while holding an exclusive flock on the store's naps/ directory., Validate *text*, write one immutable note under *parent*, return its path. (+7 more)

### Community 51 - "Skill Specs & Cursor Plugin"
Cohesion: 0.15
Nodes (14): Agent Skill Types, AgentSkills.io specification, Cursor MDC format, deploy skill, io-spec checklist resource, io-spec skill, manual-spec skill, simple-spec skill (+6 more)

### Community 52 - "CI and Docs Fixes"
Cohesion: 0.15
Nodes (14): Codecov Integration for Monorepo, Dependabot PR Remediation, Documentation Cleanup Round 2, Documentation Workflow Fixes, Fix glob-hook test environment, Clear leftover oxlint in glob-hook and docs, Docusaurus baseUrl GitHub Pages Mismatch, @a16njs/docs (+6 more)

### Community 53 - "CLI Integration Tests"
Cohesion: 0.40
Nodes (6): setupConflictScenario(), cliPath, createTempDir(), __dirname, removeTempDir(), runCli()

### Community 54 - "Plugin Loading & Registry"
Cohesion: 0.20
Nodes (9): PluginConflictStrategy, FAIL, PREFER_BUNDLED, PREFER_INSTALLED, PluginLoadResult, SkippedPlugin, PluginRegistration, PluginRegistrationInput (+1 more)

### Community 55 - "Claude Emit Formatting"
Cohesion: 0.31
Nodes (13): convertPatternToReadRule(), emit(), emitAgentSkillIO(), formatFileRuleAsClaudeRule(), formatGlobalPromptAsClaudeRule(), formatManualPromptAsSkill(), formatSkill(), getUniqueFilenameCI() (+5 more)

### Community 56 - "Engine Core"
Cohesion: 0.22
Nodes (4): A16nEngine, PluginLoader, __dirname, tempDir

### Community 58 - "Conversion Warning Codes"
Cohesion: 0.17
Nodes (11): WarningCode, Approximated, BoundaryCrossing, FileRenamed, GitStatusConflict, Merged, OperationFailed, OrphanPathRef (+3 more)

### Community 59 - "Graphify Graph Pipeline"
Cohesion: 0.18
Nodes (11): Graph Analysis, AST Extraction, Graph Building, Community Clustering, File Detection, HTML Export, Obsidian Export, Entity Extraction (+3 more)

### Community 60 - "Oxlint Configuration"
Cohesion: 0.18
Nodes (10): categories, correctness, env, builtin, plugins, rules, $schema, oxc (+2 more)

### Community 61 - "Glob Hook Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, tsx, @types/micromatch, @types/node, typescript, vitest, tsx, @types/node (+3 more)

### Community 62 - "Glob Hook TS Config"
Cohesion: 0.20
Nodes (9): compilerOptions, outDir, rootDir, types, extends, include, node, src/**/* (+1 more)

### Community 63 - "Models TS Config"
Cohesion: 0.20
Nodes (9): compilerOptions, outDir, rootDir, types, extends, include, node, src/**/* (+1 more)

### Community 64 - "Repo Tooling Stack"
Cohesion: 0.22
Nodes (9): a16n CLI, Oxlint, pnpm, Release-Please, Turborepo, Vitest, Husky, Turbo (+1 more)

### Community 65 - "Agent Skill Keywords"
Cohesion: 0.22
Nodes (9): nk-chat Skill, nk-refresh Skill, nk-save Skill, Ephemeral Context, Memory Bank, Persistent Context, Product Context, System Patterns (+1 more)

### Community 66 - "Package Keywords"
Cohesion: 0.22
Nodes (9): claude, cli, cursor, rules, keywords, agent, ai, config (+1 more)

### Community 67 - "Browserslist Targets"
Cohesion: 0.22
Nodes (9): browserslist, development, production, >0.5%, last 3 chrome version, last 3 firefox version, last 5 safari version, not dead (+1 more)

### Community 68 - "SumMem Frontier Expansion"
Cohesion: 0.28
Nodes (8): expand_frontier(), _prepare_nap(), ProjectedNode, Return a copy of *obj* with *changes* applied to named fields., One printed wake row: a view file or an in-memory expanded child., Return every view node, expanding naps only while the frontier is shorter than…, _replace(), _split_kids()

### Community 69 - "TypeScript Standards"
Cohesion: 0.25
Nodes (8): TypeScript and Functional Programming Standards, TypeScript Strict Mode Requirement, TypeScript Strict Mode Requirement, TypeScript Requirement, TypeScript Requirement, Functional Programming, TypeScript Project Guidelines, TypeScript

### Community 70 - "Config Type Validation"
Cohesion: 0.25
Nodes (8): Functional Programming Principles, TypeScript Coding Rules, file-rule Configuration Type, global-prompt Configuration Type, Glob Patterns Field, Missing Type Field Validation Error, Missing Version Field Validation Error, v1beta1 Version

### Community 71 - "Workspace Publish Invariants"
Cohesion: 0.25
Nodes (6): DEPENDENCY_BUCKETS, manifests, PackageManifest, packagesDir, repoRoot, workspaceNames

### Community 72 - "CLI TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src/**/*, ../../tsconfig.base.json

### Community 73 - "Engine TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src/**/*, ../../tsconfig.base.json

### Community 74 - "Plugin a16n TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src/**/*, ../../tsconfig.base.json

### Community 75 - "Plugin AGENTS.md TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src/**/*, ../../tsconfig.base.json

### Community 76 - "Deploy Environment Manifest"
Cohesion: 0.25
Nodes (7): environments, name, requiredApprovals, securityLevel, version, production, staging

### Community 77 - "Plugin Claude TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src/**/*, ../../tsconfig.base.json

### Community 78 - "Plugin Cursor TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src/**/*, ../../tsconfig.base.json

### Community 79 - "Written File Refactor"
Cohesion: 0.29
Nodes (7): AgentCustomization, Convert Command, Path Rewriter, sourceItems Field, sourcePaths Field, WrittenFile Model, WrittenFile Clean-Break Refactor

### Community 80 - "Monorepo Package Layout"
Cohesion: 0.29
Nodes (7): CLI Package, Engine Package, Models Package, Plugin a16n, Plugin AGENTS.md, Plugin Claude, Plugin Cursor

### Community 81 - "Shared Dev Dependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @types/node, typescript, vitest, @types/node, typescript, vitest

### Community 82 - "Package Build Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, clean, test, test:coverage, test:watch, typecheck

### Community 83 - "Docs Package Manifest"
Cohesion: 0.29
Nodes (6): description, engines, node, name, private, version

### Community 84 - "Package Build Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, clean, test, test:coverage, test:watch, typecheck

### Community 85 - "Glob Hook Keywords"
Cohesion: 0.33
Nodes (6): a16n, claude, cli, keywords, glob, hook

### Community 86 - "Secure Deploy Skill"
Cohesion: 0.33
Nodes (6): Secure Deploy Skill, Post-deploy Hook, Pre-check Script, Pre-commit Hook, Security Scan Verification, Slack Notification

### Community 87 - "Memory Bank & SumMem"
Cohesion: 0.40
Nodes (5): Memory Bank, Product Context, SumMem, System Patterns, Tech Context

### Community 88 - "Level 4 Planning Workflow"
Cohesion: 0.40
Nodes (5): Cross-Milestone Invariants, Level 4 Plan Phase, Level 4 Workflow, Milestone, Project Brief

### Community 89 - "Creative Phase Templates"
Cohesion: 0.40
Nodes (5): Creative Phase: Algorithm Design, Creative Phase: Architecture Design, Creative Phase: Generic Decision, Creative Phase Template Meta-Guide, Creative Phase: UI/UX Design

### Community 90 - "Documentation Site Build"
Cohesion: 0.40
Nodes (5): Docusaurus Documentation System, Documentation System - Comprehensive Implementation, Documentation Pagination & Workflow Integration, TypeDoc API Documentation Generator, Versioned API Generation from Git Tags

### Community 91 - "Docs Overview Pages"
Cohesion: 0.50
Nodes (5): CLI Overview, Engine Overview, Frequently Asked Questions, Introduction to a16n, Models Overview

### Community 93 - "Publish Shape Test"
Cohesion: 0.40
Nodes (4): DEPENDENCY_BUCKETS, manifest, PackageManifest, packageRoot

### Community 94 - "Database Migration Guides"
Cohesion: 0.40
Nodes (5): Database Guidelines, Migration Guide, Database Migrations Skill, Rollback Procedure, Schema Versioning

### Community 95 - "Simple Skill Fixtures"
Cohesion: 0.50
Nodes (4): Invalid Skill, Simple Skill (complex), Simple Spec Skill, SimpleAgentSkill

### Community 96 - "Repository Metadata"
Cohesion: 0.50
Nodes (4): repository, directory, type, url

### Community 97 - "Repository Metadata"
Cohesion: 0.50
Nodes (4): repository, directory, type, url

### Community 99 - "Customization Portability"
Cohesion: 0.50
Nodes (4): Agent Customization Portability, AGENTS.md Standard, Claude Code, Cursor

### Community 100 - "Target Users and Use Cases"
Cohesion: 0.50
Nodes (4): Target Audience, Library Distribution Use Case, Multi-Tool Teams Use Case, Tool Migration Use Case

### Community 101 - "React Component Standards"
Cohesion: 0.67
Nodes (3): Web Package React Function Components, Web Package React Function Components, React Function Components

### Community 102 - "IO Spec Skill"
Cohesion: 0.67
Nodes (3): IO Spec Checklist, IO Spec Skill, AgentSkillIO

### Community 103 - "Manual Prompt Skills"
Cohesion: 0.67
Nodes (3): Manual Spec Skill, Database Reset Skill, ManualPrompt Skill

### Community 104 - "Docs Release Cadence"
Cohesion: 0.67
Nodes (3): Documentation Workflow Simplification, Release Cycles as Natural Boundaries, release-please

### Community 105 - "Documentation Site Guide"
Cohesion: 0.67
Nodes (3): Docusaurus Documentation Site, llmstxt.org Artifact Format, a16n Documentation Site Guide

### Community 106 - "Release and Deploy Workflows"
Cohesion: 0.67
Nodes (3): Documentation Deployment Workflow, Release PR Lockfile Sync Workflow, Release Workflow

### Community 107 - "Frontend Component Rules"
Cohesion: 0.67
Nodes (3): JSX/TSX Paths Pattern, Frontend Component Rules, React Component Guidelines

### Community 108 - "Micromatch Dependency"
Cohesion: 0.67
Nodes (3): micromatch, dependencies, micromatch

## Knowledge Gaps
- **899 isolated node(s):** `ConflictRouteContext`, `SourceStatusEntry`, `IgnoreSource`, `IRFrontmatter`, `SpecField` (+894 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1098 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **99 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `emit()` connect `Cursor Emit Formatting` to `IR Type Guards & Helpers`, `Cursor Plugin Discovery Tests`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `emit()` connect `Claude Emit Formatting` to `IR Type Guards & Helpers`, `Claude Plugin Discovery Tests`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `CustomizationType` connect `Plugin Interface Contract` to `IR Type Guards & Helpers`, `AgentSkills.io Read/Write`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `emit()` (e.g. with `isAgentIgnore()` and `isAgentSkillIO()`) actually correct?**
  _`emit()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ConflictRouteContext`, `SourceStatusEntry`, `IgnoreSource` to the rest of the system?**
  _899 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CLI Convert Command` be split into smaller, more focused modules?**
  _Cohesion score 0.08557692307692308 - nodes in this community are weakly interconnected._
- **Should `Feature Archive History` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._