import type { A16nPlugin, CustomizationType } from '@a16n/models';
import { discover } from './discover.js';

/**
 * Claude Code plugin for a16n.
 * Supports discovery and emission of Claude configuration.
 */
const claudePlugin: A16nPlugin = {
  id: 'claude',
  name: 'Claude Code',
  supports: ['global-prompt' as CustomizationType],

  discover,

  async emit(models, root) {
    // TODO: Implement in Task 6
    return { written: [], warnings: [], unsupported: [] };
  },
};

export default claudePlugin;
