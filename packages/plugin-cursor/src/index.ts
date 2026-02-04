import { type A16nPlugin, CustomizationType } from '@a16njs/models';
import { discover } from './discover.js';
import { emit } from './emit.js';

/**
 * Cursor IDE plugin for a16n.
 * Supports discovery and emission of Cursor rules.
 */
const cursorPlugin: A16nPlugin = {
  id: 'cursor',
  name: 'Cursor IDE',
  supports: [
    CustomizationType.GlobalPrompt,
    CustomizationType.FileRule,
    CustomizationType.SimpleAgentSkill,
    CustomizationType.AgentSkillIO,
    CustomizationType.AgentIgnore,
    CustomizationType.ManualPrompt,
  ],

  discover,
  emit,
};

export default cursorPlugin;
