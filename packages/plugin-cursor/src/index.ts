import type { A16nPlugin, CustomizationType } from '@a16n/models';
import { discover } from './discover.js';
import { emit } from './emit.js';

/**
 * Cursor IDE plugin for a16n.
 * Supports discovery and emission of Cursor rules.
 */
const cursorPlugin: A16nPlugin = {
  id: 'cursor',
  name: 'Cursor IDE',
  supports: ['global-prompt' as CustomizationType],

  discover,
  emit,
};

export default cursorPlugin;
