import * as path from 'path';
import {
  type AgentCustomization,
  type GlobalPrompt,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type FileRule,
  type AgentIgnore,
  type ManualPrompt,
  CustomizationType,
} from './types.js';

/**
 * Infer the canonical emission name for a GlobalPrompt from its source file path.
 *
 * Set at discovery time by all discovery plugins. Used by emission plugins for
 * output filename. Discovery plugins MUST call this (or provide an equivalent
 * domain-specific name) when constructing a GlobalPrompt.
 *
 * Handles edge cases:
 * - Leading-dot filenames:   `.cursorrules`    → `cursorrules`
 * - Double extensions:       `.cursorrules.md` → `cursorrules`
 * - Standard files:          `CLAUDE.md`       → `CLAUDE`
 * - Dot-less basenames:      `AGENTS.md`       → `AGENTS`
 * - Rule files:              `my-rule.mdc`     → `my-rule`
 *
 * @param sourcePath - The source file path; only the basename is used.
 * @returns The name to use for emission filenames (non-empty string).
 */
export function inferGlobalPromptName(sourcePath: string): string {
  const basename = path.basename(sourcePath);

  if (basename.startsWith('.')) {
    // Leading-dot filename (e.g. `.cursorrules`, `.cursorrules.md`):
    // strip the leading dot first, then strip any remaining extension.
    const noDot = basename.slice(1);
    const ext = path.extname(noDot);
    return ext ? noDot.slice(0, -ext.length) : noDot;
  } else {
    // Normal filename (e.g. `CLAUDE.md`, `my-rule.mdc`, `foo.bar.mdc`):
    // strip only the last extension.
    const ext = path.extname(basename);
    return ext ? basename.slice(0, -ext.length) : basename;
  }
}

/**
 * Type guard to check if an item is a GlobalPrompt.
 */
export function isGlobalPrompt(item: AgentCustomization): item is GlobalPrompt {
  return item.type === CustomizationType.GlobalPrompt;
}

/**
 * Type guard to check if an item is a SimpleAgentSkill.
 */
export function isSimpleAgentSkill(item: AgentCustomization): item is SimpleAgentSkill {
  return item.type === CustomizationType.SimpleAgentSkill;
}

/**
 * @deprecated Use isSimpleAgentSkill instead.
 * This alias is provided for backward compatibility.
 */
export const isAgentSkill = isSimpleAgentSkill;

/**
 * Type guard to check if an item is an AgentSkillIO (full AgentSkills.io skill).
 */
export function isAgentSkillIO(item: AgentCustomization): item is AgentSkillIO {
  return item.type === CustomizationType.AgentSkillIO;
}

/**
 * Type guard to check if an item is a FileRule.
 */
export function isFileRule(item: AgentCustomization): item is FileRule {
  return item.type === CustomizationType.FileRule;
}

/**
 * Type guard to check if an item is an AgentIgnore.
 */
export function isAgentIgnore(item: AgentCustomization): item is AgentIgnore {
  return item.type === CustomizationType.AgentIgnore;
}

/**
 * Type guard to check if an item is a ManualPrompt.
 */
export function isManualPrompt(item: AgentCustomization): item is ManualPrompt {
  return item.type === CustomizationType.ManualPrompt;
}

/**
 * Get a unique filename by appending a counter if the name already exists.
 * @param baseName - The base name to start with
 * @param usedNames - Set of already used names (will be mutated to add the result)
 * @param extension - Optional extension to append (e.g., '.txt')
 * @returns A unique name not in usedNames
 */
export function getUniqueFilename(
  baseName: string,
  usedNames: Set<string>,
  extension = ''
): string {
  let name = baseName + extension;
  let counter = 1;
  while (usedNames.has(name)) {
    name = `${baseName}-${counter}${extension}`;
    counter++;
  }
  usedNames.add(name);
  return name;
}

/**
 * Create a unique ID from a customization type and source path.
 * @param type - The customization type
 * @param sourcePath - The path where the item was found
 * @returns A unique identifier string
 */
export function createId(type: CustomizationType, sourcePath: string): string {
  return `${type}:${sourcePath}`;
}
