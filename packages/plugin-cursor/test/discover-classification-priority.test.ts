import { describe, it, expect } from 'vitest';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import { CustomizationType, type ManualPrompt } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('Classification Priority', () => {
  it('should prioritize alwaysApply: true as GlobalPrompt', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe(CustomizationType.GlobalPrompt);
  });

  it('should classify rules with empty globs: and description as SimpleAgentSkill (not FileRule)', async () => {
    const root = path.join(fixturesDir, 'cursor-empty-globs-with-description/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe(CustomizationType.SimpleAgentSkill);
    expect((result.items[0] as import('@a16njs/models').SimpleAgentSkill).description).toBe(
      'when to do a thing properly',
    );
  });

  it('should classify rules with valid globs over description (globs takes precedence)', async () => {
    const root = path.join(fixturesDir, 'cursor-globs-and-description/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe(CustomizationType.FileRule);
  });

  it('should classify rules without activation criteria as ManualPrompt', async () => {
    const root = path.join(fixturesDir, 'cursor-rule-no-criteria/from-cursor');
    const result = await cursorPlugin.discover(root);

    // Both rules should be ManualPrompt (no alwaysApply, no globs, no description)
    expect(result.items).toHaveLength(2);
    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.ManualPrompt);
    }
  });

  it('should derive promptName from filename for ManualPrompt rules', async () => {
    const root = path.join(fixturesDir, 'cursor-rule-no-criteria/from-cursor');
    const result = await cursorPlugin.discover(root);

    const helperPrompt = result.items.find(
      i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'helper',
    );
    expect(helperPrompt).toBeDefined();
    expect(helperPrompt?.sourcePath).toBe('.cursor/rules/helper.mdc');
  });

  it('should classify rules with alwaysApply: false and no other criteria as ManualPrompt', async () => {
    const root = path.join(fixturesDir, 'cursor-rule-no-criteria/from-cursor');
    const result = await cursorPlugin.discover(root);

    const helperPrompt = result.items.find(i => i.sourcePath.includes('helper'));
    expect(helperPrompt).toBeDefined();
    expect(helperPrompt?.type).toBe(CustomizationType.ManualPrompt);
  });

  it('should classify rules with no frontmatter as ManualPrompt', async () => {
    const root = path.join(fixturesDir, 'cursor-rule-no-criteria/from-cursor');
    const result = await cursorPlugin.discover(root);

    const noFrontmatterPrompt = result.items.find(i => i.sourcePath.includes('no-frontmatter'));
    expect(noFrontmatterPrompt).toBeDefined();
    expect(noFrontmatterPrompt?.type).toBe(CustomizationType.ManualPrompt);
  });
});
