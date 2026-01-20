import type { A16nPlugin, CustomizationType } from '@a16n/models';
import { discover } from './discover.js';
import { emit } from './emit.js';

/**
 * Claude Code plugin for a16n.
 * Supports discovery and emission of Claude configuration.
 */
const claudePlugin: A16nPlugin = {
  id: 'claude',
  name: 'Claude Code',
  supports: ['global-prompt' as CustomizationType],

  discover,
  emit,
};

export default claudePlugin;
