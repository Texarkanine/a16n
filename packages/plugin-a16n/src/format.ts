import * as yaml from 'yaml';
import {
  type AgentCustomization,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type ManualPrompt,
  type AgentIgnore,
  type AgentSkillSpecFields,
  CustomizationType,
  isGlobalPrompt,
  isFileRule,
  isSimpleAgentSkill,
  isManualPrompt,
  isAgentIgnore,
} from '@a16njs/models';

/**
 * Copy an item's AgentSkills.io spec fields into a frontmatter object under
 * their *spec* key names.
 *
 * The IR stores these camelCase (`allowedTools`, `specMetadata`); on disk they
 * must be `allowed-tools` and `metadata`, so an `.a16n/` file stays legible to
 * anything that already reads AgentSkills.io frontmatter.
 *
 * `specMetadata` writing as `metadata:` is not a conflict with the rule that
 * `AgentCustomization.metadata` is never serialized: they are unrelated things
 * that happen to share a name. The IR property is transient plugin bookkeeping;
 * this one is author-written content that must persist.
 *
 * @param frontmatter - Frontmatter object being built, mutated in place
 * @param fields - The item whose spec fields should be copied
 */
function addSpecFields(
  frontmatter: Record<string, unknown>,
  fields: AgentSkillSpecFields
): void {
  if (fields.license) frontmatter.license = fields.license;
  if (fields.compatibility) frontmatter.compatibility = fields.compatibility;
  if (fields.specMetadata && Object.keys(fields.specMetadata).length > 0) {
    frontmatter.metadata = fields.specMetadata;
  }
  if (fields.allowedTools) frontmatter['allowed-tools'] = fields.allowedTools;
}

/**
 * Format an IR item as a markdown file with YAML frontmatter.
 * 
 * Format: ---\n{yaml}---\n\n{content}\n
 * 
 * Includes: version, type, relativeDir (if present), type-specific fields
 * Excludes: sourcePath (omitted from IR format), metadata (not serialized)
 * Note: name is included for SimpleAgentSkill (required in v1beta2); for other types it remains filename-only.
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
  
  // Add type-specific fields (DO NOT include sourcePath or metadata)
  if (isFileRule(item)) {
    frontmatter.globs = item.globs;
  } else if (isSimpleAgentSkill(item)) {
    frontmatter.name = item.name;
    frontmatter.description = item.description;
  } else if (isAgentIgnore(item)) {
    frontmatter.patterns = item.patterns;
  }
  // ManualPrompt: DO NOT include promptName (derived from relativeDir + filename)
  // GlobalPrompt: no extra fields

  if (isSimpleAgentSkill(item) || isManualPrompt(item)) {
    addSpecFields(frontmatter, item);
  }
  
  // Generate YAML frontmatter with clean, readable output
  const yamlStr = yaml.stringify(frontmatter, {
    lineWidth: 0, // Disable line wrapping
    defaultStringType: 'PLAIN', // Use plain strings when possible
    defaultKeyType: 'PLAIN', // Use plain keys (no quotes)
  }).trim();
  
  // Format as: ---\n{yaml}---\n\n{content}\n
  return `---\n${yamlStr}\n---\n\n${item.content}\n`;
}
