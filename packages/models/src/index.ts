// @a16njs/models - Type definitions and plugin interface for a16n

// Types
export {
  CustomizationType,
  type AgentCustomization,
  type GlobalPrompt,
  type SimpleAgentSkill,
  type AgentSkill, // Deprecated alias for SimpleAgentSkill
  type AgentSkillIO,
  type FileRule,
  type AgentIgnore,
  type ManualPrompt,
} from './types.js';

// Plugin interface
export {
  type A16nPlugin,
  type PluginPathPatterns,
  type DiscoveryResult,
  type EmitResult,
  type EmitOptions,
  type WrittenFile,
} from './plugin.js';

// Warnings
export { WarningCode, type Warning } from './warnings.js';

// Helpers
export {
  isGlobalPrompt,
  isSimpleAgentSkill,
  isAgentSkill, // Deprecated alias for isSimpleAgentSkill
  isAgentSkillIO,
  isFileRule,
  isAgentIgnore,
  isManualPrompt,
  getUniqueFilename,
  createId,
} from './helpers.js';

// Version utilities
export {
  type IRVersion,
  type ParsedIRVersion,
  CURRENT_IR_VERSION,
  parseIRVersion,
  areVersionsCompatible,
  getCurrentVersion,
} from './version.js';

// AgentSkills.io utilities
export {
  type ParsedSkillFrontmatter,
  type ParsedSkill,
  parseSkillFrontmatter,
  readSkillFiles,
  writeAgentSkillIO,
  readAgentSkillIO,
} from './agentskills-io.js';
