/**
 * @a16njs/plugin-a16n - a16n Intermediate Representation (IR) Plugin
 * 
 * This plugin enables reading and writing the a16n intermediate representation
 * to/from disk in a human-readable, git-friendly format with versioned schema support.
 * 
 * Plugin ID: 'a16n'
 * CLI usage: --from a16n, --to a16n
 * 
 * Directory structure: .a16n/<type>/<name>.md
 */

import type { A16nPlugin, AgentCustomization, EmitOptions } from '@a16njs/models';
import { CustomizationType } from '@a16njs/models';
import { emit as emitImpl } from './emit.js';
import { discover as discoverImpl } from './discover.js';

// Export utility functions and types
export { parseIRFile, type ParseIRFileResult } from './parse.js';
export { formatIRFile } from './format.js';
export { extractRelativeDir, slugify, getNameWithoutExtension } from './utils.js';
export { emit } from './emit.js';
export { discover } from './discover.js';

/**
 * The a16n IR plugin.
 * 
 * Supports reading and writing the a16n intermediate representation format.
 * Files are stored in `.a16n/` directory with YAML frontmatter containing
 * version and type metadata.
 */
const plugin: A16nPlugin = {
  id: 'a16n',
  name: 'a16n Intermediate Representation',
  supports: [
    CustomizationType.GlobalPrompt,
    CustomizationType.FileRule,
    CustomizationType.SimpleAgentSkill,
    CustomizationType.AgentSkillIO,
    CustomizationType.AgentIgnore,
    CustomizationType.ManualPrompt,
  ],
  
  /**
   * Discover IR files from .a16n/ directory.
   * 
   * @param root - Project root directory
   * @returns Discovery result with parsed IR items
   */
  discover: discoverImpl,
  
  /**
   * Emit IR files to .a16n/ directory.
   * 
   * @param models - IR items to emit
   * @param root - Project root directory
   * @param options - Emission options
   * @returns Emit result with written files
   */
  emit: emitImpl,
};

export default plugin;
