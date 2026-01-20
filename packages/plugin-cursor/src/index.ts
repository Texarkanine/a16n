import type { A16nPlugin, CustomizationType } from '@a16n/models';
import { discover } from './discover.js';

/**
 * Cursor IDE plugin for a16n.
 * Supports discovery and emission of Cursor rules.
 */
const cursorPlugin: A16nPlugin = {
  id: 'cursor',
  name: 'Cursor IDE',
  supports: ['global-prompt' as CustomizationType],

  discover,

  async emit(models, root) {
    // TODO: Implement in Task 4
    return { written: [], warnings: [], unsupported: [] };
  },
};

export default cursorPlugin;
