import { describe, it, expect } from 'vitest';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import { CustomizationType } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('AgentIgnore Discovery', () => {
  it('should discover AgentIgnore from .cursorignore file', async () => {
    const root = path.join(fixturesDir, 'cursor-ignore/from-cursor');
    const result = await cursorPlugin.discover(root);

    const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
    expect(agentIgnore).toBeDefined();
    expect(agentIgnore?.sourcePath).toBe('.cursorignore');
  });

  it('should parse patterns from .cursorignore (ignoring comments and blanks)', async () => {
    const root = path.join(fixturesDir, 'cursor-ignore/from-cursor');
    const result = await cursorPlugin.discover(root);

    const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore) as import('@a16njs/models').AgentIgnore;
    expect(agentIgnore).toBeDefined();

    // Should have patterns, not comments
    expect(agentIgnore.patterns).toContain('dist/');
    expect(agentIgnore.patterns).toContain('build/');
    expect(agentIgnore.patterns).toContain('.env');
    expect(agentIgnore.patterns).toContain('.env.local');
    expect(agentIgnore.patterns).toContain('*.log');
    expect(agentIgnore.patterns).toContain('secrets/');

    // Should not include comments
    expect(agentIgnore.patterns).not.toContain('# Build output');
  });

  it('should return null for empty .cursorignore', async () => {
    const root = path.join(fixturesDir, 'cursor-ignore-empty/from-cursor');
    const result = await cursorPlugin.discover(root);

    const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
    expect(agentIgnore).toBeUndefined();
  });

  it('should return null for comments-only .cursorignore', async () => {
    const root = path.join(fixturesDir, 'cursor-ignore-comments/from-cursor');
    const result = await cursorPlugin.discover(root);

    const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
    expect(agentIgnore).toBeUndefined();
  });

  it('should discover both rules and AgentIgnore together', async () => {
    const root = path.join(fixturesDir, 'cursor-ignore/from-cursor');
    const result = await cursorPlugin.discover(root);

    // Should have both GlobalPrompt (from .mdc) and AgentIgnore (from .cursorignore)
    const globalPrompt = result.items.find(i => i.type === CustomizationType.GlobalPrompt);
    const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);

    expect(globalPrompt).toBeDefined();
    expect(agentIgnore).toBeDefined();
  });
});
