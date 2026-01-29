/**
 * The taxonomy of agent customization types.
 * Each type represents a different way agents can be customized.
 */
export enum CustomizationType {
  /** Always-applied prompts (CLAUDE.md, alwaysApply rules) */
  GlobalPrompt = 'global-prompt',
  /** Context-triggered by description matching */
  AgentSkill = 'agent-skill',
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
 * A skill that is activated by description matching.
 * Examples: Cursor rules with description but no globs
 */
export interface AgentSkill extends AgentCustomization {
  type: CustomizationType.AgentSkill;
  /** What triggers this skill */
  description: string;
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
