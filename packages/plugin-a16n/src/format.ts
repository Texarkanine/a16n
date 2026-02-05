import * as yaml from 'yaml';
import {
  type AgentCustomization,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type ManualPrompt,
  type AgentIgnore,
  CustomizationType,
  isGlobalPrompt,
  isFileRule,
  isSimpleAgentSkill,
  isManualPrompt,
  isAgentIgnore,
} from '@a16njs/models';

/**
 * Format an IR item as a markdown file with YAML frontmatter.
 * 
 * Format: ---\n{yaml}---\n\n{content}\n
 * 
 * Includes: version, type, relativeDir (if present), type-specific fields
 * Excludes: sourcePath (omitted from IR format), metadata (not serialized), name (filename is the identifier)
 * 
 * @param item - The IR item to format
 * @returns Formatted markdown string with YAML frontmatter
 */
export function formatIRFile(item: AgentCustomization): string {
  // Build frontmatter object based on type
  const frontmatter: Record<string, unknown> = {
    version: item.version,
    type: item.type,
  };
  
  // Add relativeDir if present (check undefined, not truthy, to preserve empty strings)
  if (item.relativeDir !== undefined) {
    frontmatter.relativeDir = item.relativeDir;
  }
  
  // Add type-specific fields (DO NOT include name, sourcePath, or metadata)
  if (isFileRule(item)) {
    frontmatter.globs = item.globs;
  } else if (isSimpleAgentSkill(item)) {
    frontmatter.description = item.description;
  } else if (isAgentIgnore(item)) {
    frontmatter.patterns = item.patterns;
  }
  // ManualPrompt: DO NOT include promptName (derived from relativeDir + filename)
  // GlobalPrompt: no extra fields
  
  // Generate YAML frontmatter with clean, readable output
  const yamlStr = yaml.stringify(frontmatter, {
    lineWidth: 0, // Disable line wrapping
    defaultStringType: 'PLAIN', // Use plain strings when possible
    defaultKeyType: 'PLAIN', // Use plain keys (no quotes)
  }).trim();
  
  // Format as: ---\n{yaml}---\n\n{content}\n
  return `---\n${yamlStr}\n---\n\n${item.content}\n`;
}
