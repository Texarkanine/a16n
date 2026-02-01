/**
 * The taxonomy of agent customization types.
 * Each type represents a different way agents can be customized.
 */
export enum CustomizationType {
  /** Always-applied prompts (CLAUDE.md, alwaysApply rules) */
  GlobalPrompt = 'global-prompt',
  /** Simple skill triggered by description matching (no hooks, resources, or extra files) */
  SimpleAgentSkill = 'simple-agent-skill',
  /** Full AgentSkills.io standard skill with hooks, resources, and multiple files */
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
 */
export interface AgentCustomization {
  /** Unique identifier for this item */
  id: string;
  /** The type of customization */
  type: CustomizationType;
  /** Original file path where this was discovered */
  sourcePath: string;
  /** The actual prompt/rule content */
  content: string;
  /** Tool-specific extras that don't fit the standard model */
  metadata: Record<string, unknown>;
}

/**
 * A global prompt that is always applied.
 * Examples: CLAUDE.md, Cursor rules with alwaysApply: true
 */
export interface GlobalPrompt extends AgentCustomization {
  type: CustomizationType.GlobalPrompt;
}

/**
 * A simple skill that is activated by description matching.
 * Examples: Cursor rules with description but no globs, simple SKILL.md files
 *
 * For full AgentSkills.io standard skills with hooks, resources, and files,
 * use AgentSkillIO instead.
 */
export interface SimpleAgentSkill extends AgentCustomization {
  type: CustomizationType.SimpleAgentSkill;
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
 * Supports multiple files, hooks, resources, and complex activation.
 *
 * Use this type for skills that include:
 * - Hooks (pre-commit, post-deploy, etc.)
 * - Resource files (checklists, configs, scripts)
 * - Multiple files in a skill directory
 */
export interface AgentSkillIO extends AgentCustomization {
  type: CustomizationType.AgentSkillIO;

  /** Skill name (from frontmatter or directory name) */
  name: string;

  /** Description for activation matching (required) */
  description: string;

  /** Optional: Hooks defined in frontmatter */
  hooks?: Record<string, unknown>;

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
 */
export interface ManualPrompt extends AgentCustomization {
  type: CustomizationType.ManualPrompt;
  /** Prompt name for invocation (e.g., "review" for /review) */
  promptName: string;
}
