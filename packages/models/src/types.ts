/**
 * The taxonomy of agent customization types.
 * Each type represents a different way agents can be customized.
 */
export enum CustomizationType {
  /** Always-applied prompts (CLAUDE.md, alwaysApply rules) */
  GlobalPrompt = 'global-prompt',
  /** Simple skill triggered by description matching (no resources or extra files) */
  SimpleAgentSkill = 'simple-agent-skill',
  /** Full AgentSkills.io standard skill with resources and multiple files (NO hooks) */
  AgentSkillIO = 'agent-skill-io',
  /** Triggered by file glob patterns */
  FileRule = 'file-rule',
  /** Files/patterns to exclude from agent context */
  AgentIgnore = 'agent-ignore',
  /** Explicitly invoked prompts (slash commands, skills with disable-model-invocation) */
  ManualPrompt = 'manual-prompt',
}

/**
 * Base interface for all agent customization items.
 * Every customization discovered or emitted extends this interface.
 *
 * BREAKING CHANGES (Phase 9):
 * - `version` is now required (was not present)
 * - `sourcePath` is now optional (was required)
 * - `relativeDir` added as optional field for directory structure preservation
 */
export interface AgentCustomization {
  /** Unique identifier for this item */
  id: string;
  /** The type of customization */
  type: CustomizationType;
  /** IR version (required, e.g., 'v1beta1') */
  version: string;
  /** Original file path where this was discovered (optional, omitted in IR format) */
  sourcePath?: string;
  /** Relative directory path for preserving directory structure (optional) */
  relativeDir?: string;
  /** The actual prompt/rule content */
  content: string;
  /**
   * Tool-specific extras that don't fit the standard model (transient, not serialized in IR).
   *
   * This is **not** the AgentSkills.io `metadata` frontmatter field — that one is
   * author-authored and must persist. See {@link AgentSkillSpecFields.specMetadata}.
   */
  metadata: Record<string, unknown>;
}

/**
 * Optional AgentSkills.io frontmatter fields shared by every skill-shaped IR type.
 *
 * These are modeled purely so they survive conversion; a16n does not act on them
 * and does not validate the spec's length or format constraints.
 *
 * @see https://agentskills.io/specification.md
 */
export interface AgentSkillSpecFields {
  /** License name or a reference to a bundled license file. Provenance only. */
  license?: string;
  /** Environment requirements, e.g. `Requires Python 3.14+ and uv`. Documentation only. */
  compatibility?: string;
  /**
   * The AgentSkills.io spec's `metadata` field: author-authored client properties,
   * persisted to disk under the key `metadata`.
   *
   * Distinct from {@link AgentCustomization.metadata}, which is transient and is
   * never serialized.
   */
  specMetadata?: Record<string, string>;
  /**
   * Space-separated list of pre-approved tools, preserved as the authored string
   * (e.g. `Bash(git:*) Bash(jq:*) Read`) rather than split, because re-joining a
   * parsed list invites normalization bugs.
   *
   * Experimental in the spec, but the only one of these fields with enforcement
   * semantics: dropping it makes the emitted skill more permissive than authored.
   */
  allowedTools?: string;
}

/**
 * A global prompt that is always applied.
 * Examples: CLAUDE.md, Cursor rules with alwaysApply: true
 */
export interface GlobalPrompt extends AgentCustomization {
  type: CustomizationType.GlobalPrompt;
  /**
   * Canonical name for emission output filename (e.g. `'cursorrules'`, `'CLAUDE'`).
   * Set at discovery time using `inferGlobalPromptName(sourcePath)` from `@a16njs/models`.
   * Emission plugins use this directly — no re-derivation from source paths needed.
   */
  name: string;
}

/**
 * A simple skill that is activated by description matching.
 * Examples: Cursor rules with description but no globs, simple SKILL.md files
 *
 * For full AgentSkills.io standard skills with resources and files,
 * use AgentSkillIO instead.
 */
export interface SimpleAgentSkill extends AgentCustomization, AgentSkillSpecFields {
  type: CustomizationType.SimpleAgentSkill;
  /** Invocation name — the directory name (or rule filename) used for slash-command invocation (e.g., "banana" for /banana). Required for skills to invoke properly. */
  name: string;
  /** What triggers this skill */
  description: string;
}

/**
 * @deprecated Use SimpleAgentSkill instead.
 * This type alias is provided for backward compatibility.
 */
export type AgentSkill = SimpleAgentSkill;

/**
 * Full AgentSkills.io standard skill.
 * Supports multiple resource files in the skill directory.
 *
 * NOTE: Hooks are NOT part of AgentSkills.io and are not supported.
 * Skills with hooks should be skipped during discovery with a warning.
 *
 * Use this type for skills that include:
 * - Resource files (checklists, configs, scripts)
 * - Multiple files in a skill directory
 */
export interface AgentSkillIO extends AgentCustomization, AgentSkillSpecFields {
  type: CustomizationType.AgentSkillIO;

  /** Skill name (from frontmatter or directory name) */
  name: string;

  /** Description for activation matching (required) */
  description: string;

  /** Optional: Resource file paths relative to skill directory */
  resources?: string[];

  /** Optional: If true, only invoked via /name */
  disableModelInvocation?: boolean;

  /**
   * Map of additional files in the skill directory.
   * Key: relative path, Value: file content
   */
  files: Record<string, string>;
}

/**
 * A rule that is triggered by file patterns.
 * Examples: Cursor rules with globs
 */
export interface FileRule extends AgentCustomization {
  type: CustomizationType.FileRule;
  /** File patterns that trigger this rule */
  globs: string[];
}

/**
 * Patterns for files the agent should ignore.
 * Examples: .cursorignore
 */
export interface AgentIgnore extends AgentCustomization {
  type: CustomizationType.AgentIgnore;
  /** Gitignore-style patterns */
  patterns: string[];
}

/**
 * A manually-invoked prompt (slash command or skill with disable-model-invocation).
 * Examples: Cursor commands in .cursor/commands/, skills with disable-model-invocation: true
 *
 * These prompts are only activated when explicitly invoked by the user.
 *
 * Both target plugins emit this type as a `SKILL.md`, which is why it carries
 * {@link AgentSkillSpecFields}. Those fields are always `undefined` for prompts
 * originating from `.cursor/commands/*.md`, which have no frontmatter.
 *
 * Optional {@link ManualPrompt.description} holds authored prose from skill
 * frontmatter when present. Command-origin prompts leave it unset; emitters
 * synthesize `Invoke with /<promptName>` only in that case.
 */
export interface ManualPrompt extends AgentCustomization, AgentSkillSpecFields {
  type: CustomizationType.ManualPrompt;
  /** Prompt name for invocation (e.g., "review" for /review) */
  promptName: string;
  /**
   * Authored description from skill frontmatter, when present.
   * Absent for prompts discovered from `.cursor/commands/*.md`.
   */
  description?: string;
}
