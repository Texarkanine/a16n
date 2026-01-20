// @a16n/models - Type definitions and plugin interface for a16n

// Types
export {
  CustomizationType,
  type AgentCustomization,
  type GlobalPrompt,
  type AgentSkill,
  type FileRule,
  type AgentIgnore,
} from './types.js';

// Plugin interface
export {
  type A16nPlugin,
  type DiscoveryResult,
  type EmitResult,
  type WrittenFile,
} from './plugin.js';

// Warnings
export { WarningCode, type Warning } from './warnings.js';

// Helpers
export {
  isGlobalPrompt,
  isAgentSkill,
  isFileRule,
  isAgentIgnore,
  createId,
} from './helpers.js';
