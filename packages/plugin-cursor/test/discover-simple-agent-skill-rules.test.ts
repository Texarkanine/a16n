import { describe, it, expect } from 'vitest';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import { CustomizationType } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('SimpleAgentSkill Discovery', () => {
  it('should discover SimpleAgentSkill items from rules with description: frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(2);

    // All should be SimpleAgentSkill
    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.SimpleAgentSkill);
    }
  });

  it('should extract description from frontmatter without quotes', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const authSkill = result.items.find(i => i.sourcePath.includes('auth'));
    expect(authSkill).toBeDefined();
    expect(authSkill?.type).toBe(CustomizationType.SimpleAgentSkill);
    expect((authSkill as import('@a16njs/models').SimpleAgentSkill).description).toBe(
      'Authentication and authorization patterns',
    );
  });

  it('should extract description from frontmatter with quotes', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const dbSkill = result.items.find(i => i.sourcePath.includes('database'));
    expect(dbSkill).toBeDefined();
    expect(dbSkill?.type).toBe(CustomizationType.SimpleAgentSkill);
    expect((dbSkill as import('@a16njs/models').SimpleAgentSkill).description).toBe(
      'Database operations and ORM usage',
    );
  });

  it('should include rule content in SimpleAgentSkill items', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const authSkill = result.items.find(i => i.sourcePath.includes('auth'));
    expect(authSkill?.content).toContain('Use JWT for stateless authentication');
  });
});
