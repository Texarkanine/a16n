import {
  type AgentCustomization,
  type GlobalPrompt,
  type AgentSkill,
  type FileRule,
  type AgentIgnore,
  type AgentCommand,
  CustomizationType,
} from './types.js';

/**
 * Type guard to check if an item is a GlobalPrompt.
 */
export function isGlobalPrompt(item: AgentCustomization): item is GlobalPrompt {
  return item.type === CustomizationType.GlobalPrompt;
}

/**
 * Type guard to check if an item is an AgentSkill.
 */
export function isAgentSkill(item: AgentCustomization): item is AgentSkill {
  return item.type === CustomizationType.AgentSkill;
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
 * Type guard to check if an item is an AgentCommand.
 */
export function isAgentCommand(item: AgentCustomization): item is AgentCommand {
  return item.type === CustomizationType.AgentCommand;
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
