import type {
  AgentCustomization,
  GlobalPrompt,
  AgentSkill,
  FileRule,
  AgentIgnore,
  CustomizationType,
} from './types.js';

/**
 * Type guard to check if an item is a GlobalPrompt.
 */
export function isGlobalPrompt(item: AgentCustomization): item is GlobalPrompt {
  return item.type === ('global-prompt' as CustomizationType);
}

/**
 * Type guard to check if an item is an AgentSkill.
 */
export function isAgentSkill(item: AgentCustomization): item is AgentSkill {
  return item.type === ('agent-skill' as CustomizationType);
}

/**
 * Type guard to check if an item is a FileRule.
 */
export function isFileRule(item: AgentCustomization): item is FileRule {
  return item.type === ('file-rule' as CustomizationType);
}

/**
 * Type guard to check if an item is an AgentIgnore.
 */
export function isAgentIgnore(item: AgentCustomization): item is AgentIgnore {
  return item.type === ('agent-ignore' as CustomizationType);
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
