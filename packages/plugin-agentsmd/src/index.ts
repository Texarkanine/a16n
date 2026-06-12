import { type A16nPlugin, CustomizationType } from '@a16njs/models';
import { discover } from './discover.js';
import { emit } from './emit.js';

/**
 * AGENTS.md plugin for a16n.
 *
 * Discovers AGENTS.md files at any directory depth (root → GlobalPrompt,
 * nested → directory-scoped FileRule) and emits GlobalPrompts and
 * directory-shaped FileRules back to AGENTS.md files.
 *
 * AGENTS.md is plain markdown with no frontmatter, globs, or skills, so
 * conversion into this format is lossy for most customization types; the
 * standard warning channels (`skipped`, `merged`, `overwritten`) and the
 * `unsupported` result surface exactly what could not be represented.
 *
 * No `pathPatterns`: AGENTS.md files have no fixed directory prefix (they
 * live at any depth), so this plugin opts out of the engine's path-reference
 * scanning rather than misreporting it.
 */
const agentsmdPlugin: A16nPlugin = {
  id: 'agentsmd',
  name: 'AGENTS.md',
  supports: [
    CustomizationType.GlobalPrompt,
    CustomizationType.FileRule,
  ],

  discover,
  emit,
};

export default agentsmdPlugin;
